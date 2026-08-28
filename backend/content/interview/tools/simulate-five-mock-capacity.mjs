#!/usr/bin/env node

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const seedCountArgument = args.find((arg) => arg.startsWith("--seed-count="));
const seedCount = Number(seedCountArgument?.slice("--seed-count=".length) || 100);
if (!Number.isInteger(seedCount) || seedCount < 1 || seedCount > 10_000) {
  throw new Error("--seed-count must be an integer from 1 through 10000.");
}
for (const arg of args) {
  if (arg !== seedCountArgument) throw new Error(`Unknown argument: ${arg}`);
}

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(toolDir, "..", "..", "..");
// Exercise the exact default artifacts accepted by public production. No
// candidate override or runtime alias is permitted in this release gate.
process.env.NODE_ENV = "production";
process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = "false";
process.env.INTERVIEW_MODE_ACCESS = "public";
process.env.INTERVIEW_SYSTEM_DESIGN_ACCESS = "off";
delete process.env.INTERVIEW_BANK_PUBLIC_PATH;
delete process.env.INTERVIEW_BANK_PRIVATE_PATH;
delete process.env.INTERVIEW_BANK_RELEASE_PATH;
delete process.env.INTERVIEW_CODING_PUBLIC_PATH;
delete process.env.INTERVIEW_CODING_PRIVATE_PATH;
delete process.env.INTERVIEW_CODING_RELEASE_PATH;

const require = createRequire(import.meta.url);
const {
  loadInterviewArtifacts,
  resetInterviewArtifactsCache,
} = require(path.join(backendRoot, "services", "interview", "artifacts.js"));
const {
  selectCodingVariant,
  selectQuestions,
} = require(path.join(backendRoot, "services", "interview", "selection.js"));

const tracks = ["core-web", "react", "angular", "vue"];
const levels = ["junior", "mid", "senior"];
const budgets = Object.freeze({ junior: 600, mid: 720, senior: 900 });
const firstMocksWithoutRepeats = 5;

function overlaps(items, excludedIds, excludedConceptIds) {
  return items.some((item) => (
    excludedIds.has(item.id)
    || excludedConceptIds.has(item.conceptId || item.id)
  ));
}

resetInterviewArtifactsCache();
const artifacts = loadInterviewArtifacts({ force: true });
const matrix = [];

for (const track of tracks) {
  for (const level of levels) {
    const entry = {
      track,
      level,
      seedCount,
      passedSeeds: 0,
      failedSeeds: 0,
      mcqFailures: 0,
      codingFailures: 0,
      overlapFailures: 0,
      firstFailureByAttempt: Array(firstMocksWithoutRepeats).fill(0),
    };
    for (let seedIndex = 0; seedIndex < seedCount; seedIndex += 1) {
      const excludedMcqIds = new Set();
      const excludedMcqConceptIds = new Set();
      const excludedCodingIds = new Set();
      const excludedCodingConceptIds = new Set();
      let failed = false;

      for (let attempt = 1; attempt <= firstMocksWithoutRepeats; attempt += 1) {
        const seed = `capacity:${track}:${level}:${seedIndex}:${attempt}`;
        const targetExposureCount = attempt - 1;
        const remainingHardExclusionMocks = firstMocksWithoutRepeats - attempt;
        let selectedQuestions;
        let selectedCoding;
        try {
          selectedQuestions = selectQuestions({
            questions: artifacts.bank.questions,
            track,
            level,
            excludedIds: excludedMcqIds,
            excludedConceptIds: excludedMcqConceptIds,
            maxEstimatedSeconds: budgets[level],
            seed,
            targetExposureCount,
            remainingHardExclusionMocks,
          });
        } catch {
          entry.mcqFailures += 1;
          entry.firstFailureByAttempt[attempt - 1] += 1;
          failed = true;
          break;
        }
        try {
          selectedCoding = selectCodingVariant({
            variants: artifacts.coding.variants,
            track,
            level,
            excludedIds: excludedCodingIds,
            excludedConceptIds: excludedCodingConceptIds,
            seed,
          });
        } catch {
          entry.codingFailures += 1;
          entry.firstFailureByAttempt[attempt - 1] += 1;
          failed = true;
          break;
        }

        if (
          overlaps(selectedQuestions, excludedMcqIds, excludedMcqConceptIds)
          || overlaps([selectedCoding], excludedCodingIds, excludedCodingConceptIds)
        ) {
          entry.overlapFailures += 1;
          entry.firstFailureByAttempt[attempt - 1] += 1;
          failed = true;
          break;
        }
        for (const question of selectedQuestions) {
          excludedMcqIds.add(question.id);
          excludedMcqConceptIds.add(question.conceptId || question.id);
        }
        excludedCodingIds.add(selectedCoding.id);
        excludedCodingConceptIds.add(selectedCoding.conceptId || selectedCoding.id);
      }

      if (failed) {
        entry.failedSeeds += 1;
      } else if (
        excludedMcqIds.size === 25
        && excludedMcqConceptIds.size === 25
        && excludedCodingIds.size === 5
        && excludedCodingConceptIds.size === 5
      ) {
        entry.passedSeeds += 1;
      } else {
        entry.failedSeeds += 1;
        entry.overlapFailures += 1;
      }
    }
    matrix.push(entry);
  }
}

console.log(
  "track/level\tpassed\tfailed\tmcq\tcoding\toverlap\tfirstFailureAttempts(1..5)",
);
for (const entry of matrix) {
  console.log(
    `${entry.track}/${entry.level}\t${entry.passedSeeds}\t${entry.failedSeeds}`
    + `\t${entry.mcqFailures}\t${entry.codingFailures}\t${entry.overlapFailures}`
    + `\t${entry.firstFailureByAttempt.join(",")}`,
  );
}
const totalFailures = matrix.reduce((total, entry) => total + entry.failedSeeds, 0);
console.log(
  `[five-mock-capacity] approved MCQ=${artifacts.bank.questions.length}, `
  + `coding=${artifacts.coding.variants.length}, seeds=${seedCount * matrix.length}, `
  + `failures=${totalFailures}.`,
);
if (totalFailures) process.exitCode = 1;
