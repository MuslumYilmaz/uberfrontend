#!/usr/bin/env node

import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  buildCodingSelectionMetadata,
  buildInterviewContent,
  codingReleaseReadinessReport,
  interviewContentDir,
  loadInterviewArtifactPins,
  mcqSourceFiles,
  selectionDefinitionHash,
  validateBuiltInterviewContent,
  validateInterviewArtifactPins,
} from "../tools/interview-content-lib.mjs";

function refreshSelectionMetadata(built) {
  built.authoring.selectionDefinitionHash = selectionDefinitionHash(built.authoring);
  built.selectionMetadata = buildCodingSelectionMetadata(built.authoring);
}

test("coding concept metadata stays private and matches the approved artifacts", () => {
  const built = buildInterviewContent();
  const pins = loadInterviewArtifactPins();
  assert.deepEqual(validateBuiltInterviewContent(built), []);
  assert.equal(built.release.status, "editorial-gold");
  assert.equal(built.release.registryVersion, pins.coding.registryVersion);
  assert.equal(built.release.registryContentHash, pins.coding.registryContentHash);
  assert.equal(built.release.selectionDefinitionHash, pins.coding.selectionDefinitionHash);
  assert.equal(built.release.definitionHash, pins.coding.definitionHash);
  assert.equal(built.selectionMetadata.variants.length, 60);
  assert.equal(new Set(built.authoring.variants.map((variant) => variant.conceptId)).size, 30);
  assert.doesNotMatch(JSON.stringify(built.publicPackage), /conceptId/);
  assert.equal(
    built.privatePackage.variants.every((variant) => /^coding-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(variant.conceptId)),
    true,
  );
  assert.match(built.selectionMetadata.selectionDefinitionHash, /^[0-9a-f]{64}$/);
  assert.equal(
    built.privatePackage.selectionDefinitionHash,
    built.authoring.selectionDefinitionHash,
  );
  assert.equal(
    built.release.selectionDefinitionHash,
    built.authoring.selectionDefinitionHash,
  );
  for (const [name, expected] of Object.entries(built.files)) {
    assert.equal(fs.readFileSync(path.join(interviewContentDir, name), "utf8"), expected);
  }
});

test("framework-equivalent tasks share concepts while each track-level pair remains distinct", () => {
  const built = buildInterviewContent();
  for (const family of [
    "counter",
    "todo",
    "pagination",
    "shopping-cart",
    "debounced-search",
    "chips-autocomplete",
    "tabs-switcher",
    "progress-thresholds",
    "filterable-user-list",
    "theme-toggle",
    "multi-step-form",
    "nested-checkboxes",
    "contact-form",
    "nested-comments",
    "transfer-list",
  ]) {
    const variants = built.authoring.variants.filter((variant) => variant.id.includes(`-${family}-v1`));
    assert.equal(variants.length, 3);
    assert.equal(new Set(variants.map((variant) => variant.conceptId)).size, 1);
    assert.deepEqual(new Set(variants.map((variant) => variant.track)), new Set([
      "react",
      "angular",
      "vue",
    ]));
  }
});

test("candidate pressure contracts stay private and are shared only by semantic family", () => {
  const built = buildInterviewContent();
  const candidateVariants = built.authoring.variants.filter(
    (variant) => variant.pressureAsset?.startsWith("authoring://pressure-modes/"),
  );
  assert.equal(candidateVariants.length, 27);
  assert.equal(new Set(candidateVariants.map((variant) => variant.pressureAsset)).size, 9);
  assert.doesNotMatch(JSON.stringify(built.publicPackage), /authoring:\/\/|pressureAsset/);
  const privateById = new Map(
    built.privatePackage.variants.map((variant) => [variant.id, variant]),
  );
  for (const variant of candidateVariants) {
    assert.equal(
      privateById.get(variant.id)?.sourceEvidence?.pressureAsset,
      variant.pressureAsset,
    );
  }
});

test("approved release has five distinct concepts in every combination", () => {
  const built = buildInterviewContent();
  const report = codingReleaseReadinessReport(built);
  assert.equal(built.authoring.status, "editorial-gold");
  assert.deepEqual(built.authoring.finalApproval, {
    approvedBy: "project-owner",
    approvedAt: "2026-08-24",
    registryVersion: "1.1.0",
    registryContentHash: "d84c6c6f733ae9aff4b4f516656bc93a10643f570ea85034d5cf1e924e35dae8",
    selectionDefinitionHash: "95ae46b01019649017306384cd4928315a33ccb8d77c50f48306b2ecb5bc4c3e",
    notes: [
      "Project owner approved coding registry v1.1.0 for editorial-gold production use after the release-readiness audit.",
    ],
  });
  assert.equal(report.ready, true);
  assert.deepEqual(report.errors, []);
  assert.equal(report.matrix.length, 12);
  for (const entry of report.matrix) {
    assert.equal(entry.enabledVariantCount, 5);
    assert.equal(entry.distinctConceptCount, 5);
    assert.equal(entry.minimumNetNewVariants, 0);
    assert.equal(entry.ready, true);
  }
});

test("coding validator rejects missing, colliding, and publicly leaked concept metadata", () => {
  const missing = structuredClone(buildInterviewContent());
  delete missing.authoring.variants[0].conceptId;
  refreshSelectionMetadata(missing);
  assert.match(validateBuiltInterviewContent(missing).join("\n"), /missing or invalid private conceptId/);

  const collision = structuredClone(buildInterviewContent());
  const junior = collision.authoring.variants.find((variant) => variant.level === "junior");
  const senior = collision.authoring.variants.find((variant) => variant.level === "senior");
  senior.conceptId = junior.conceptId;
  refreshSelectionMetadata(collision);
  assert.match(validateBuiltInterviewContent(collision).join("\n"), /collision spans multiple levels/);

  const leaked = structuredClone(buildInterviewContent());
  leaked.publicPackage.variants[0].conceptId = "coding-private-selection-leak";
  assert.match(validateBuiltInterviewContent(leaked).join("\n"), /leaked private keys/);
});

test("the Gold approval must remain bound to the private selection taxonomy", () => {
  const built = structuredClone(buildInterviewContent());
  built.authoring.finalApproval.selectionDefinitionHash = "0".repeat(64);
  assert.match(
    validateBuiltInterviewContent(built).join("\n"),
    /selectionDefinitionHash/,
  );
});

test("the generated coding release must match the shared artifact pin manifest", () => {
  const built = structuredClone(buildInterviewContent());
  built.release.definitionHash = "0".repeat(64);
  assert.match(
    validateBuiltInterviewContent(built).join("\n"),
    /Coding definitionHash does not match interview-artifact-pins-v1\.json/,
  );
});

test("external file pins reject self-consistent MCQ and coding artifact rewrites", () => {
  const coding = structuredClone(buildInterviewContent());
  coding.files["interview-coding-registry-v1.public.json"] += " ";
  assert.match(
    validateBuiltInterviewContent(coding).join("\n"),
    /Coding public artifact SHA-256 does not match interview-artifact-pins-v1\.json/,
  );

  const mcqFiles = mcqSourceFiles();
  const mcqPublic = JSON.parse(mcqFiles["frontend-interview-bank-v1.public.json"]);
  const mcqRelease = JSON.parse(mcqFiles["frontend-interview-bank-v1.release.json"]);
  mcqPublic.items[0].prompt += " Tampered.";
  const publicText = `${JSON.stringify(mcqPublic, null, 2)}\n`;
  mcqRelease.artifacts.public.sha256 = crypto
    .createHash("sha256")
    .update(publicText)
    .digest("hex");
  const errors = validateInterviewArtifactPins({
    mcqRelease,
    mcqArtifacts: {
      public: publicText,
      private: mcqFiles["frontend-interview-bank-v1.private.json"],
      release: `${JSON.stringify(mcqRelease, null, 2)}\n`,
    },
  });
  assert.match(
    errors.join("\n"),
    /MCQ public artifact SHA-256 does not match interview-artifact-pins-v1\.json/,
  );
});
