import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importSolution, runTaskTests } from './js-task-test-lib.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const catalog = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'cdn/questions/javascript/coding.json'), 'utf8'),
);

// Every reference solution passes every test of its task, in JavaScript and in TypeScript.
const totals = { js: 0, ts: 0 };
for (const language of ['js', 'ts']) {
  for (const question of catalog) {
    try {
      const field = language === 'ts' ? 'codeTs' : 'codeJs';
      const source = question.solutionBlock?.approaches?.[0]?.[field];
      assert.equal(typeof source, 'string', `missing its ${field} reference solution`);
      const solution = await importSolution(source, language, question.id);
      const results = await runTaskTests(question, language, solution);
      const failed = results.filter((result) => !result.passed);
      assert.equal(
        failed.length,
        0,
        failed.map((result) => `${result.fullName}: ${result.error?.message ?? result.error}`).join('; '),
      );
      totals[language] += results.length;
    } catch (error) {
      error.message = `${question.id}/${language}: ${error.message}`;
      throw error;
    }
  }
}

console.log(
  `[catalog-solution-execution] ${catalog.length} JavaScript solutions/${totals.js} checks and ${catalog.length} TypeScript solutions/${totals.ts} checks passed`,
);
