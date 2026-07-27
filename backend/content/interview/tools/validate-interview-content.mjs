#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import {
  buildInterviewContent,
  interviewContentDir,
  sha256,
  validateBuiltInterviewContent,
  validateMcqRuntimeCopies,
} from "./interview-content-lib.mjs";

const built = buildInterviewContent();
const errors = [
  ...validateBuiltInterviewContent(built),
  ...validateMcqRuntimeCopies(true),
];
for (const [name, expectedText] of Object.entries(built.files)) {
  const filePath = path.join(interviewContentDir, name);
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing generated coding artifact: ${name}.`);
    continue;
  }
  const actualText = fs.readFileSync(filePath, "utf8");
  if (actualText !== expectedText) errors.push(`Stale generated coding artifact: ${name}.`);
}
const releasePath = path.join(interviewContentDir, "interview-coding-registry-v1.release.json");
if (fs.existsSync(releasePath)) {
  const release = JSON.parse(fs.readFileSync(releasePath, "utf8"));
  for (const kind of ["public", "private"]) {
    const artifactPath = path.join(interviewContentDir, release.artifacts?.[kind]?.file || "");
    if (!fs.existsSync(artifactPath)) {
      errors.push(`Release references missing ${kind} coding artifact.`);
      continue;
    }
    const actualHash = sha256(fs.readFileSync(artifactPath, "utf8"));
    if (actualHash !== release.artifacts[kind].sha256) {
      errors.push(`Release ${kind} coding artifact SHA-256 mismatch.`);
    }
  }
}

if (errors.length) {
  console.error(`[interview-content] validation failed (${errors.length}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log(
  `[interview-content] validation passed: ${built.release.variantCount} coding variants, `
  + `${built.release.enabledVariantCount} review-enabled; MCQ runtime copy is approved and leak-free.`,
);
