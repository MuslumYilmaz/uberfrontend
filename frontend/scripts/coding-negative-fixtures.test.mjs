// Known wrong solutions of the JavaScript tasks must fail the tests written to catch them, and some test in the
// TypeScript suite as well; known right alternatives must pass both suites. catalog-solution-execution.test.mjs runs
// the reference solutions; this is the other half. Each fixture under coding-negative-fixtures/<task id>/ starts with
// "// Wrong: <why>" and one "// Fails: <test name>" line per JavaScript test that must fail, or with "// Right: <why>".
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importSolution, runTaskTests } from './js-task-test-lib.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const fixtureDir = path.join(scriptDir, 'coding-negative-fixtures');
const catalog = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'cdn/questions/javascript/coding.json'), 'utf8'),
);

const describeFailures = (results) =>
  results.filter((result) => !result.passed).map((result) => `${result.name}: ${result.error?.message ?? result.error}`).join('; ');

const counts = { wrong: 0, right: 0 };
for (const id of fs.readdirSync(fixtureDir).sort()) {
  const question = catalog.find((entry) => entry.id === id);
  assert.ok(question, `${id}: fixtures for a task that is not in the catalog`);
  for (const file of fs.readdirSync(path.join(fixtureDir, id)).sort()) {
    const label = `${id}/${file}`;
    const source = fs.readFileSync(path.join(fixtureDir, id, file), 'utf8');
    const right = /^\/\/ Right: /.test(source);
    const mustFail = [...source.matchAll(/^\/\/ Fails: (.+)$/gm)].map((match) => match[1].trim());
    assert.ok(right || (/^\/\/ Wrong: /.test(source) && mustFail.length), `${label}: start with "// Right:", or with "// Wrong:" and "// Fails:" lines`);

    for (const language of ['js', 'ts']) {
      const solution = await importSolution(source, 'js', `${label}-${language}`);
      const results = await runTaskTests(question, language, solution);
      if (right) {
        assert.ok(results.every((result) => result.passed), `${label} failed ${language} tests: ${describeFailures(results)}`);
        continue;
      }
      assert.ok(results.some((result) => !result.passed), `${label} passed every ${language} test`);
      if (language !== 'js') continue;
      for (const name of mustFail) {
        const result = results.find((entry) => entry.name === name);
        assert.ok(result, `${label}: the task has no test named "${name}"`);
        assert.equal(result.passed, false, `${label}: "${name}" passed`);
      }
    }
    counts[right ? 'right' : 'wrong'] += 1;
  }
}

console.log(
  `[coding-negative-fixtures] ${counts.wrong} wrong solutions fail their tests and ${counts.right} right alternatives pass, in JavaScript and TypeScript`,
);
