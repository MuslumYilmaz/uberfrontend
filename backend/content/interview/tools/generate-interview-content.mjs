#!/usr/bin/env node

import {
  authoringPath,
  buildInterviewContent,
  definitionHash,
  interviewContentDir,
  mcqSourceFiles,
  readJson,
  syncFiles,
  validateBuiltInterviewContent,
  validateMcqRuntimeCopies,
} from "./interview-content-lib.mjs";

const args = new Set(process.argv.slice(2));
const check = args.has("--check");
if (args.has("--print-definition-hash")) {
  console.log(definitionHash(readJson(authoringPath)));
  process.exit(0);
}
for (const arg of args) {
  if (!["--check"].includes(arg)) throw new Error(`Unknown argument: ${arg}`);
}

const built = buildInterviewContent();
const validationErrors = validateBuiltInterviewContent(built);
if (validationErrors.length) {
  throw new Error(`Interview coding registry is invalid:\n- ${validationErrors.join("\n- ")}`);
}
const mismatches = [
  ...syncFiles(built.files, interviewContentDir, check),
  ...syncFiles(mcqSourceFiles(), interviewContentDir, check),
];
const mcqErrors = validateMcqRuntimeCopies(check);
if (mcqErrors.length) {
  throw new Error(`Interview MCQ runtime artifacts are invalid:\n- ${mcqErrors.join("\n- ")}`);
}
if (check && mismatches.length) {
  throw new Error(`Generated interview artifacts are stale:\n- ${mismatches.join("\n- ")}`);
}
console.log(
  `[interview-content] ${check ? "verified" : "generated"} `
  + `${built.release.variantCount} coding variants and the approved MCQ bank.`,
);
