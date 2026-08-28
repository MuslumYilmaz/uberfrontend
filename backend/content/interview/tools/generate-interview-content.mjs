#!/usr/bin/env node

import {
  authoringPath,
  buildInterviewContent,
  definitionHash,
  interviewContentDir,
  mcqSourceFiles,
  readJson,
  selectionDefinitionHash,
  syncFiles,
  validateBuiltInterviewContent,
  validateMcqRuntimeCopies,
} from "./interview-content-lib.mjs";
import {
  buildSystemDesignContent,
  systemDesignAuthoringPath,
  systemDesignDefinitionHash,
  validateBuiltSystemDesignContent,
} from "./system-design-content-lib.mjs";

const args = new Set(process.argv.slice(2));
const check = args.has("--check");
if (args.has("--print-definition-hash")) {
  console.log(definitionHash(readJson(authoringPath)));
  process.exit(0);
}
if (args.has("--print-selection-definition-hash")) {
  console.log(selectionDefinitionHash(readJson(authoringPath)));
  process.exit(0);
}
if (args.has("--print-system-design-definition-hash")) {
  console.log(systemDesignDefinitionHash(readJson(systemDesignAuthoringPath)));
  process.exit(0);
}
for (const arg of args) {
  if (!["--check"].includes(arg)) throw new Error(`Unknown argument: ${arg}`);
}

const built = buildInterviewContent();
const systemDesignBuilt = buildSystemDesignContent();
const validationErrors = validateBuiltInterviewContent(built);
if (validationErrors.length) {
  throw new Error(`Interview coding registry is invalid:\n- ${validationErrors.join("\n- ")}`);
}
const systemDesignValidationErrors = validateBuiltSystemDesignContent(systemDesignBuilt);
if (systemDesignValidationErrors.length) {
  throw new Error(
    `Interview system-design registry is invalid:\n- `
    + `${systemDesignValidationErrors.join("\n- ")}`,
  );
}
const mcqSourceErrors = validateMcqRuntimeCopies(false);
if (mcqSourceErrors.length) {
  throw new Error(`Interview MCQ source artifacts are invalid:\n- ${mcqSourceErrors.join("\n- ")}`);
}
const mismatches = [
  ...syncFiles(built.files, interviewContentDir, check),
  ...syncFiles(systemDesignBuilt.files, interviewContentDir, check),
  ...syncFiles(mcqSourceFiles(), interviewContentDir, check),
];
const mcqErrors = check ? validateMcqRuntimeCopies(true) : [];
if (mcqErrors.length) {
  throw new Error(`Interview MCQ runtime artifacts are invalid:\n- ${mcqErrors.join("\n- ")}`);
}
if (check && mismatches.length) {
  throw new Error(`Generated interview artifacts are stale:\n- ${mismatches.join("\n- ")}`);
}
console.log(
  `[interview-content] ${check ? "verified" : "generated"} `
  + `${built.release.variantCount} coding variants, `
  + `${systemDesignBuilt.release.scenarioCount} system-design scenarios, `
  + "and the approved MCQ bank.",
);
