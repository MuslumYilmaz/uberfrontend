#!/usr/bin/env node

import assert from "assert/strict";
import { validateOutputQuestion } from "./output-question-validator.mjs";

function validQuestion() {
  return {
    id: "js-event-loop-output",
    questionFormat: "output",
    outputChallenge: {
      language: "javascript",
      runtime: "browser",
      responseType: "single-choice",
      prompt: "What is logged?",
      code: "console.log('A');",
      options: [
        { id: "first-output", lines: ["A", "B", "C"] },
        { id: "second-output", lines: ["A", "C", "B"] },
        { id: "third-output", lines: ["B", "A", "C"] },
      ],
      correctOptionId: "second-output",
      explanation: "Synchronous work runs before queued callbacks.",
    },
  };
}

function validate(question, context = { tech: "javascript", kind: "trivia" }) {
  return validateOutputQuestion(question, context);
}

function expectIssue(question, expected, context) {
  assert.match(validate(question, context).join("\n"), expected);
}

assert.deepEqual(validate(validQuestion()), []);
assert.deepEqual(validate({ id: "regular-trivia" }), []);

{
  const question = validQuestion();
  delete question.questionFormat;
  expectIssue(question, /outputChallenge requires questionFormat/);
}

{
  const question = validQuestion();
  question.questionFormat = "free-text";
  expectIssue(question, /questionFormat must be "output"/);
}

expectIssue(
  validQuestion(),
  /only supported for javascript\/trivia/,
  { tech: "react", kind: "trivia" },
);
expectIssue(
  validQuestion(),
  /only supported for javascript\/trivia/,
  { tech: "javascript", kind: "coding" },
);

{
  const question = validQuestion();
  question.incidentCard = null;
  expectIssue(question, /must not define incidentCard/);
}

{
  const question = validQuestion();
  question.outputChallenge = null;
  expectIssue(question, /outputChallenge must be an object/);
}

for (const [field, invalidValue, expected] of [
  ["language", "typescript", /language must be "javascript"/],
  ["runtime", "worker", /runtime must be either "browser" or "node"/],
  ["responseType", "text", /responseType must be "single-choice"/],
  ["prompt", "   ", /prompt must be a non-empty string/],
  ["code", "", /code must be a non-empty string/],
  ["explanation", null, /explanation must be a non-empty string/],
]) {
  const question = validQuestion();
  question.outputChallenge[field] = invalidValue;
  expectIssue(question, expected);
}

{
  const question = validQuestion();
  question.outputChallenge.options.pop();
  expectIssue(question, /options must contain exactly 3 options/);
}

{
  const question = validQuestion();
  question.outputChallenge.options[1].id = "first-output";
  expectIssue(question, /id must be unique/);
}

{
  const question = validQuestion();
  question.outputChallenge.options[1].id = "not_kebab_case";
  expectIssue(question, /id must be a non-empty kebab-case string/);
}

{
  const question = validQuestion();
  question.outputChallenge.options[1].lines = [];
  expectIssue(question, /lines must be a non-empty array of non-empty strings/);
}

{
  const question = validQuestion();
  question.outputChallenge.options[1].lines = ["A", 2, "B"];
  expectIssue(question, /lines must be a non-empty array of non-empty strings/);
}

{
  const question = validQuestion();
  question.outputChallenge.options[1].lines = [" A ", "B", "C"];
  expectIssue(question, /lines must describe a unique output sequence/);
}

{
  const question = validQuestion();
  question.outputChallenge.correctOptionId = "missing-output";
  expectIssue(question, /correctOptionId must reference an existing option id/);
}

console.log("[output-question-validator.test] ok");
