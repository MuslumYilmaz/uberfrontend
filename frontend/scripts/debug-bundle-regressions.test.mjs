import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTsModule } from './load-ts-module.mjs';

// Multi-file debugging tasks run here the way the browser sandbox runs them: the same bundle format, the same
// module linking and the same matchers, with Node's data: URLs where the worker uses blob URLs.
const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(frontendRoot, '..');
const { parseFileBundle } = loadTsModule(path.join(frontendRoot, 'src/app/core/utils/file-bundle.util.ts'));
const { linkModules } = loadTsModule(path.join(frontendRoot, 'src/app/core/security/user-code-sandbox-modules.ts'));
const { createSandboxExpect } = loadTsModule(path.join(frontendRoot, 'src/app/core/security/user-code-sandbox-matchers.ts'));

const dataUrl = (code) => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
let runs = 0;

async function runTask(files, tests) {
  const queue = [];
  const suites = [];
  globalThis.describe = (name, fn) => {
    suites.push(name);
    try { fn(); } finally { suites.pop(); }
  };
  globalThis.test = globalThis.it = (name, fn) => queue.push({ name: [...suites, name].join(' › '), fn });
  globalThis.expect = createSandboxExpect((value) => {
    try { return JSON.stringify(value); } catch { return String(value); }
  });
  runs += 1;
  // A new URL for every run, so Node's module cache always registers the tests again.
  await import(dataUrl(`${linkModules(files, tests, dataUrl)}\n// run ${runs}\n`));
  const results = [];
  for (const { name, fn } of queue) {
    try {
      await fn();
      results.push({ name, passed: true });
    } catch (error) {
      results.push({ name, passed: false, error: String(error?.message ?? error) });
    }
  }
  return results;
}

const failingNames = (results) => results.filter((result) => !result.passed).map((result) => result.name).sort();

const debug = JSON.parse(fs.readFileSync(path.join(repoRoot, 'cdn/questions/javascript/debug.json'), 'utf8'));
const bundled = debug.filter((entry) => parseFileBundle(entry.starterCode));
assert.ok(bundled.length >= 1, 'at least one debugging task is a multi-file repo');

for (const entry of bundled) {
  const starter = parseFileBundle(entry.starterCode);
  const solution = parseFileBundle(entry.solution);
  assert.ok(solution, `${entry.id}: the solution is a multi-file bundle too`);
  assert.deepEqual(solution.map((file) => file.path), starter.map((file) => file.path), `${entry.id}: the solution fixes files, it does not add or drop them`);

  const solved = await runTask(solution, entry.tests);
  assert.ok(solved.length >= 2, `${entry.id}: the tests run`);
  assert.deepEqual(failingNames(solved), [], `${entry.id}: the solution passes every test: ${JSON.stringify(solved.filter((result) => !result.passed))}`);

  // Each file the solution changes holds one bug: with only that file left as it was, only that bug's tests fail,
  // and the starter fails exactly those tests together.
  const unsolved = await runTask(starter, entry.tests);
  const perBug = [];
  for (const file of starter) {
    if (solution.find((fixed) => fixed.path === file.path).code === file.code) continue;
    const failing = failingNames(await runTask(solution.map((fixed) => (fixed.path === file.path ? file : fixed)), entry.tests));
    assert.ok(failing.length, `${entry.id}: the bug in ${file.path} fails a test`);
    perBug.push(...failing);
  }
  assert.equal(new Set(perBug).size, perBug.length, `${entry.id}: no test fails for two files' bugs`);
  assert.deepEqual(failingNames(unsolved), [...perBug].sort(), `${entry.id}: the starter fails exactly the tests of its bugs`);
}

const squash = debug.find((entry) => entry.id === 'js-debug-bug-squash-invoices');
assert.ok(squash);
assert.equal(squash.access, 'premium');
assert.deepEqual(squash.companies, ['stripe']);
assert.equal(squash.solutionBlock.approaches[0].codeJs, squash.solution, 'the Solution tab shows the code the checks run');
assert.deepEqual(parseFileBundle(squash.starterCode).map((file) => file.path), ['src/currency.js', 'src/line-items.js', 'src/ids.js', 'src/invoice.js', 'src/payments.js']);
assert.deepEqual(failingNames(await runTask(parseFileBundle(squash.starterCode), squash.tests)), [
  'currency › converts a typed amount to minor units without losing a cent',
  'invoice › lists lines largest first without reordering the cart it was given',
  'invoice › takes an amount-off coupon in minor units',
  'payments › retries a timeout with the same idempotency key',
], 'the four reports each have a failing test; the zero-decimal and declined-card tests guard against a wrong fix');

console.log(`Debug bundle regressions: PASS (${bundled.length} task${bundled.length === 1 ? '' : 's'}, ${runs} runs)`);
