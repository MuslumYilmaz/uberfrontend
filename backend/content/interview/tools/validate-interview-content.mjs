#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import {
  buildInterviewContent,
  codingReleaseReadinessReport,
  interviewContentDir,
  sha256,
  validateBuiltInterviewContent,
  validateMcqRuntimeCopies,
} from "./interview-content-lib.mjs";
import {
  buildSystemDesignContent,
  validateBuiltSystemDesignContent,
} from "./system-design-content-lib.mjs";

const args = new Set(process.argv.slice(2));
for (const argument of args) {
  if (argument !== "--release-gate") throw new Error(`Unknown argument: ${argument}`);
}
const requireReleaseReady = args.has("--release-gate");
const built = buildInterviewContent();
const systemDesignBuilt = buildSystemDesignContent();
const codingReleaseReadiness = codingReleaseReadinessReport(built);
const errors = [
  ...validateBuiltInterviewContent(built),
  ...(requireReleaseReady ? codingReleaseReadiness.errors : []),
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
  if (requireReleaseReady) {
    console.error("[interview-content] coding release-readiness matrix:");
    codingReleaseReadiness.matrix.forEach((entry) => console.error(
      `- ${entry.track}/${entry.level}: ${entry.enabledVariantCount} enabled, `
      + `${entry.distinctConceptCount} concepts, ${entry.minimumNetNewVariants} minimum net-new`,
    ));
  }
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
