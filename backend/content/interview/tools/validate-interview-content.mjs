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
import {
  buildSystemDesignContent,
  validateBuiltSystemDesignContent,
} from "./system-design-content-lib.mjs";

const built = buildInterviewContent();
const systemDesignBuilt = buildSystemDesignContent();
const errors = [
  ...validateBuiltInterviewContent(built),
  ...validateBuiltSystemDesignContent(systemDesignBuilt),
  ...validateMcqRuntimeCopies(true),
];
for (const [kind, content] of [
  ["coding", built],
  ["system-design", systemDesignBuilt],
]) {
  for (const [name, expectedText] of Object.entries(content.files)) {
    const filePath = path.join(interviewContentDir, name);
    if (!fs.existsSync(filePath)) {
      errors.push(`Missing generated ${kind} artifact: ${name}.`);
      continue;
    }
    const actualText = fs.readFileSync(filePath, "utf8");
    if (actualText !== expectedText) errors.push(`Stale generated ${kind} artifact: ${name}.`);
  }
}

for (const [kind, releaseName] of [
  ["coding", "interview-coding-registry-v1.release.json"],
  ["system-design", "interview-system-design-registry-v1.release.json"],
]) {
  const releasePath = path.join(interviewContentDir, releaseName);
  if (fs.existsSync(releasePath)) {
    const release = JSON.parse(fs.readFileSync(releasePath, "utf8"));
    for (const visibility of ["public", "private"]) {
      const artifactPath = path.join(
        interviewContentDir,
        release.artifacts?.[visibility]?.file || "",
      );
      if (!fs.existsSync(artifactPath)) {
        errors.push(`Release references missing ${visibility} ${kind} artifact.`);
        continue;
      }
      const actualHash = sha256(fs.readFileSync(artifactPath, "utf8"));
      if (actualHash !== release.artifacts[visibility].sha256) {
        errors.push(`Release ${visibility} ${kind} artifact SHA-256 mismatch.`);
      }
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
  + `${built.release.enabledVariantCount} review-enabled; `
  + `${systemDesignBuilt.release.scenarioCount} system-design scenarios; `
  + "MCQ runtime copy is approved and leak-free.",
);
