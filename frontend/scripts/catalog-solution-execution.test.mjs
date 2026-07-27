import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const catalog = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'cdn/questions/javascript/coding.json'), 'utf8'),
);
const AsyncFunction = Object.getPrototypeOf(async function noop() {}).constructor;
const TEST_TIMEOUT_MS = 5_000;

function transpile(source, fileName) {
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

async function importSolution(question, language) {
  const field = language === 'ts' ? 'codeTs' : 'codeJs';
  const source = question.solutionBlock?.approaches?.[0]?.[field];
  assert.equal(typeof source, 'string', `${question.id} is missing its ${field} reference solution`);
  const executable = language === 'ts' ? transpile(source, `${question.id}.ts`) : source;
  const encoded = Buffer.from(executable).toString('base64');
  return (await import(`data:text/javascript;base64,${encoded}#${question.id}-${language}`)).default;
}

function partialMatch(actual, expected, location = 'value') {
  if (expected === null || typeof expected !== 'object') {
    assert.deepEqual(actual, expected, `${location} did not match`);
    return;
  }
  assert.ok(actual !== null && typeof actual === 'object', `${location} is not an object`);
  for (const key of Reflect.ownKeys(expected)) {
    partialMatch(actual[key], expected[key], `${location}.${String(key)}`);
  }
}

function assertThrows(value, expected) {
  const invoke = typeof value === 'function' ? value : () => { throw value; };
  if (expected === undefined) {
    assert.throws(invoke);
  } else if (typeof expected === 'string') {
    assert.throws(invoke, (error) => String(error?.message || error).includes(expected));
  } else if (expected instanceof RegExp) {
    assert.throws(invoke, expected);
  } else {
    assert.throws(invoke, expected);
  }
}

function expect(received) {
  const syncMatchers = {
    toBe(expected) {
      assert.ok(Object.is(received, expected), `Expected ${String(received)} to be ${String(expected)}`);
    },
    toEqual(expected) {
      assert.deepEqual(received, expected);
    },
    toMatchObject(expected) {
      partialMatch(received, expected);
    },
    toThrow(expected) {
      assertThrows(received, expected);
    },
  };

  const asyncMatchers = (expectRejection) => ({
    async toBe(expected) {
      const value = await settlePromise(received, expectRejection);
      assert.ok(Object.is(value, expected), `Expected ${String(value)} to be ${String(expected)}`);
    },
    async toEqual(expected) {
      assert.deepEqual(await settlePromise(received, expectRejection), expected);
    },
    async toMatchObject(expected) {
      partialMatch(await settlePromise(received, expectRejection), expected);
    },
    async toThrow(expected) {
      assertThrows(await settlePromise(received, expectRejection), expected);
    },
  });

  return Object.defineProperties(syncMatchers, {
    resolves: { get: () => asyncMatchers(false) },
    rejects: { get: () => asyncMatchers(true) },
  });
}

async function settlePromise(value, expectRejection) {
  const outcome = await Promise.resolve(value).then(
    (resolved) => ({ status: 'resolved', value: resolved }),
    (error) => ({ status: 'rejected', value: error }),
  );
  if (expectRejection && outcome.status !== 'rejected') {
    assert.fail('Expected promise to reject, but it resolved');
  }
  if (!expectRejection && outcome.status !== 'resolved') throw outcome.value;
  return outcome.value;
}

function prepareTests(source, solution, language, fileName) {
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
  return {
    solution,
    executable: language === 'ts' ? transpile(injected, fileName) : injected,
  };
}

async function withTimeout(run, label) {
  let timer;
  try {
    await Promise.race([
      Promise.resolve().then(run),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} exceeded ${TEST_TIMEOUT_MS}ms`)), TEST_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function runEmbeddedTests(question, language) {
  const testField = language === 'ts' ? 'testsTs' : 'tests';
  const source = question[testField];
  assert.equal(typeof source, 'string', `${question.id} is missing ${testField}`);
  const solution = await importSolution(question, language);
  const { executable } = prepareTests(source, solution, language, `${question.id}.${testField}.ts`);
  const cases = [];
  const suiteNames = [];
  const register = (name, fn) => {
    assert.equal(typeof fn, 'function', `${question.id}/${language} test "${name}" has no function`);
    cases.push({ name: [...suiteNames, String(name)].join(' > '), fn });
  };
  const describe = (name, fn) => {
    suiteNames.push(String(name));
    try {
      fn();
    } finally {
      suiteNames.pop();
    }
  };

  const loadTests = new AsyncFunction('__solution', 'describe', 'test', 'it', 'expect', executable);
  await loadTests(solution, describe, register, register, expect);
  assert.ok(cases.length > 0, `${question.id}/${language} registered no embedded checks`);

  for (const testCase of cases) {
    await withTimeout(testCase.fn, `${question.id}/${language}: ${testCase.name}`);
  }
  return cases.length;
}

const totals = { js: 0, ts: 0 };
for (const language of ['js', 'ts']) {
  for (const question of catalog) {
    try {
      totals[language] += await runEmbeddedTests(question, language);
    } catch (error) {
      error.message = `${question.id}/${language}: ${error.message}`;
      throw error;
    }
  }
}

console.log(
  `[catalog-solution-execution] ${catalog.length} JavaScript solutions/${totals.js} checks and ${catalog.length} TypeScript solutions/${totals.ts} checks passed`,
);
