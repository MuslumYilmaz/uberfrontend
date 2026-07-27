#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "./content-paths.mjs";
import {
  evaluateAnswerById,
  executeJavaScriptOutput,
  validateInterviewReferenceSet,
} from "./validate-interview-reference-set.mjs";

const referenceDir = path.join(repoRoot, "content-drafts", "interview-mcq");
const publicFixture = JSON.parse(
  fs.readFileSync(path.join(referenceDir, "reference-set-v1.public.json"), "utf8"),
);
const privateFixture = JSON.parse(
  fs.readFileSync(path.join(referenceDir, "reference-set-v1.private.json"), "utf8"),
);

function copy(value) {
  return structuredClone(value);
}

function validate(publicSet = publicFixture, privateSet = privateFixture, executeCode = false) {
  return validateInterviewReferenceSet(publicSet, privateSet, { executeCode });
}

function expectError(publicSet, privateSet, expected, executeCode = false) {
  const { errors } = validate(publicSet, privateSet, executeCode);
  assert.match(errors.join("\n"), expected);
}

{
  const { errors } = validate(publicFixture, privateFixture, true);
  assert.deepEqual(errors, []);
}

{
  const publicSet = copy(publicFixture);
  const privateSet = copy(privateFixture);
  publicSet.items.reverse();
  privateSet.items = [
    privateSet.items[2],
    privateSet.items[4],
    privateSet.items[0],
    privateSet.items[3],
    privateSet.items[1],
  ];
  assert.deepEqual(validate(publicSet, privateSet).errors, []);
}

{
  const publicSet = copy(publicFixture);
  publicSet.answerKey = "must-not-ship";
  expectError(publicSet, privateFixture, /private answer\/review key leaked into public data/);
}

{
  const privateSet = copy(privateFixture);
  privateSet.items[0].revision += 1;
  expectError(publicFixture, privateSet, /public\/private revisions must match/);
}

{
  const publicSet = copy(publicFixture);
  publicSet.items[0].options[0].label = "All of the above";
  expectError(publicSet, privateFixture, /all\/none of the above/);
}

{
  const publicSet = copy(publicFixture);
  publicSet.items[0].options[0].label = "This workaround always fixes the interaction.";
  expectError(publicSet, privateFixture, /avoid the answer-clue words/);
}

{
  const privateSet = copy(privateFixture);
  privateSet.items[0].optionRationales[0].verdict = "correct";
  privateSet.items[0].optionRationales[0].misconceptionTag = null;
  expectError(publicFixture, privateSet, /exactly one rationale must have verdict/);
}

{
  const publicSet = copy(publicFixture);
  const privateSet = copy(privateFixture);
  const item = publicSet.items.find((candidate) => candidate.id === "int-html-native-button-jr-v1");
  const privateItem = privateSet.items.find((candidate) => candidate.id === item.id);
  item.options.find((option) => option.id === privateItem.correctOptionId).label +=
    " This extra wording intentionally makes the keyed answer much longer than either distractor.";

  expectError(publicSet, privateSet, />25% answer-length clue requires/);

  privateItem.review.lengthClueWaiver = {
    reason: "A reviewer confirmed that the extra detail is essential to the answer contract.",
    approvedBy: "reference-set-test",
    approvedAt: "2026-07-22",
  };
  const waivedResult = validate(publicSet, privateSet);
  assert.doesNotMatch(waivedResult.errors.join("\n"), /answer-length clue requires/);
  assert.match(waivedResult.warnings.join("\n"), /correct-option length differs/);
}

{
  const privateSet = copy(privateFixture);
  const jsItem = privateSet.items.find(
    (candidate) => candidate.id === "int-js-nested-microtask-mid-v1",
  );
  jsItem.verification.expectedOutput[0] = "wrong";
  expectError(publicFixture, privateSet, /executed output .* does not match expectedOutput/, true);
}

{
  const item = publicFixture.items[0];
  const privateItem = privateFixture.items[0];
  for (const option of item.options) {
    assert.equal(
      evaluateAnswerById(item.options, privateItem.correctOptionId, option.id),
      option.id === privateItem.correctOptionId,
    );
  }
  assert.equal(evaluateAnswerById(item.options, privateItem.correctOptionId, "missing-id"), false);
}

assert.deepEqual(
  executeJavaScriptOutput(
    "console.log('sync'); Promise.resolve().then(() => console.log('microtask')); setTimeout(() => console.log('timer'), 0);",
  ),
  ["sync", "microtask", "timer"],
);

console.log("[validate-interview-reference-set.test] ok");
