#!/usr/bin/env node

import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  assertInterviewBankLifecycleOutputDir,
  assertSafeInterviewBankOutputDir,
  bankContentHash,
  buildGeneratedPackages,
  contentHashForItem,
  loadAuthoringItems,
  projectPublicItem,
  syncGeneratedFiles,
} from "./interview-bank-lib.mjs";
import {
  loadInterviewBankPolicies,
  validateInterviewBank,
  verifyBrowserConsoleOutputs,
} from "./interview-bank-validator.mjs";
import { repoRoot } from "./content-paths.mjs";

const blueprint = JSON.parse(fs.readFileSync(
  path.join(repoRoot, "content-drafts", "interview-mcq", "blueprints", "bank-v1.blueprint.json"),
  "utf8",
));
const policies = loadInterviewBankPolicies();
const NOW = new Date("2026-08-05T12:00:00.000Z");
const V1_FIXTURE_HASHES = Object.freeze({
  public: "1f1aa6192519ed98af9b232276111745a89a711036dd9e8aaf8edf225df3980e",
  private: "b226a5b4168ffb2b94b075c62deac5cc3251719ff32b804127f031a8a739ff2e",
});
const LEVELS = ["junior", "mid", "senior"];
const EXPECTED_V12_EXPANSION_IDS = Object.freeze([
  "int-js-number-finite-input-validation-jr-v1",
  "int-js-urlsearchparams-repeated-value-contract-jr-v1",
  "int-js-optional-chain-side-effect-short-circuit-jr-v1",
  "int-html-decorative-image-alt-contract-jr-v1",
  "int-html-details-summary-disclosure-jr-v1",
  "int-css-custom-property-fallback-resolution-jr-v1",
  "int-css-focus-visible-modality-jr-v1",
  "int-react-context-provider-resolution-jr-v1",
  "int-react-render-purity-jr-v1",
  "int-react-ref-nonrendering-state-jr-v1",
  "int-angular-required-input-contract-jr-v1",
  "int-angular-content-projection-selection-jr-v1",
  "int-angular-view-encapsulation-boundary-jr-v1",
  "int-vue-component-registration-scope-jr-v1",
  "int-vue-emits-listener-fallthrough-jr-v1",
  "int-vue-event-modifier-order-jr-v1",
  "int-js-readable-stream-reader-ownership-mid-v1",
  "int-js-shadow-dom-event-delegation-mid-v1",
  "int-js-async-generator-early-exit-mid-v1",
  "int-html-preload-cors-reuse-mid-v1",
  "int-html-live-region-status-update-mid-v1",
  "int-css-subgrid-alignment-boundary-mid-v1",
  "int-react-custom-hook-state-isolation-mid-v1",
  "int-react-deferred-value-staleness-mid-v1",
  "int-react-callback-ref-cleanup-mid-v1",
  "int-angular-http-context-policy-mid-v1",
  "int-angular-untracked-incidental-read-mid-v1",
  "int-angular-guard-redirect-contract-mid-v1",
  "int-angular-async-validator-latest-result-mid-v1",
  "int-vue-watcheffect-async-dependency-window-mid-v1",
  "int-vue-teleport-logical-ownership-mid-v1",
  "int-vue-effect-scope-disposal-mid-v1",
  "int-vue-vmemo-dependency-contract-mid-v1",
  "int-js-web-lock-cross-tab-write-sr-v1",
  "int-js-service-worker-response-clone-sr-v1",
  "int-js-indexeddb-transaction-lifetime-sr-v1",
  "int-js-thenable-assimilation-order-sr-v1",
  "int-html-form-associated-custom-element-sr-v1",
  "int-css-font-metric-fallback-stability-sr-v1",
  "int-css-content-visibility-scroll-estimation-sr-v1",
  "int-react-action-state-form-contract-sr-v1",
  "int-react-cache-request-lifetime-sr-v1",
  "int-react-streaming-suspense-shell-sr-v1",
  "int-react-activity-hidden-lifecycle-sr-v1",
  "int-angular-route-provider-lifetime-sr-v1",
  "int-angular-incremental-hydration-replay-sr-v1",
  "int-angular-prerender-parameter-boundary-sr-v1",
  "int-vue-error-capture-propagation-sr-v1",
  "int-vue-ssr-teleport-coordination-sr-v1",
  "int-vue-custom-directive-ssr-parity-sr-v1",
]);
function repeatedDistribution(distribution) {
  return Object.entries(distribution)
    .flatMap(([value, count]) => Array(count).fill(value));
}

{
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "frontend", "package.json"), "utf8"));
  for (const scriptName of ["verify:unit-and-content", "verify:unit-and-content:prepush"]) {
    const command = packageJson.scripts[scriptName];
    assert.match(command, /generate:interview-bank:candidate:check/);
    assert.match(command, /lint:interview-bank/);
    assert.doesNotMatch(command, /lint:interview-gold/);
  }
  const prePush = fs.readFileSync(path.join(repoRoot, ".githooks", "pre-push"), "utf8");
  assert.match(prePush, /content-drafts\/interview-mcq\//);
  const workflow = fs.readFileSync(
    path.join(repoRoot, ".github", "workflows", "frontend-unit-verify.yml"),
    "utf8",
  );
  assert.match(workflow, /playwright install --with-deps chromium/);
  assert.match(workflow, /npm run verify:unit-and-content/);
}

{
  const bankRoot = path.join(repoRoot, "content-drafts", "interview-mcq");
  const itemEntries = loadAuthoringItems(path.join(bankRoot, "items"));
  const manifest = JSON.parse(fs.readFileSync(
    path.join(bankRoot, "manifests", "bank-v1.manifest.json"),
    "utf8",
  ));
  const reviews = JSON.parse(fs.readFileSync(
    path.join(bankRoot, "reviews", "bank-v1.reviews.json"),
    "utf8",
  ));
  const result = await validateInterviewBank({
    itemEntries,
    manifest,
    reviews,
    blueprint,
    policies,
  }, { executeBrowser: false, now: NOW });

  assert.deepEqual(result.errors, []);
  assert.equal(itemEntries.length, 170);
  assert.equal(manifest.itemRefs.length, 170);
  assert.equal(reviews.items.length, 170);
  assert.equal(manifest.bankVersion, "1.2.0");
  assert.equal(manifest.status, "candidate");
  assert.equal(reviews.finalApproval, null);
  for (const review of reviews.items) {
    assert.equal(review.technical.checklistVersion, "1.3.0");
    assert.equal(review.editorial.checklistVersion, "1.3.0");
    assert.equal(review.blind.checklistVersion, "1.3.0");
  }

  const goldRelease = JSON.parse(fs.readFileSync(
    path.join(repoRoot, "backend", "content", "interview", "frontend-interview-bank-v1.release.json"),
    "utf8",
  ));
  assert.equal(goldRelease.bankVersion, "1.1.0");
  assert.equal(goldRelease.status, "editorial-gold");
  assert.equal(goldRelease.itemRefs.length, 120);
  const authoredById = new Map(itemEntries.map(({ item }) => [item.id, item]));
  const approvedCandidateRevisionBumps = new Map([
    ["int-html-data-table-header-association-mid-v1", 2],
    ["int-vue-next-tick-dom-read-timing-mid-v1", 2],
  ]);
  for (const reference of goldRelease.itemRefs) {
    const item = authoredById.get(reference.id);
    assert.ok(item, `${reference.id} from the active Gold bank must remain authored`);
    if (approvedCandidateRevisionBumps.has(reference.id)) {
      assert.equal(
        item.revision,
        approvedCandidateRevisionBumps.get(reference.id),
        `${reference.id} must retain its approved candidate revision bump`,
      );
      assert.notEqual(
        contentHashForItem(item),
        reference.contentHash,
        `${reference.id} candidate repair must not masquerade as the Gold revision`,
      );
      continue;
    }
    assert.equal(item.revision, reference.revision, `${reference.id} revision drifted from Gold`);
    assert.equal(
      contentHashForItem(item),
      reference.contentHash,
      `${reference.id} content drifted from Gold`,
    );
  }
  assert.equal(approvedCandidateRevisionBumps.size, 2);

  const goldIds = new Set(goldRelease.itemRefs.map((reference) => reference.id));
  const expansion = itemEntries
    .map(({ item }) => item)
    .filter((item) => !goldIds.has(item.id));
  assert.equal(expansion.length, 50);
  assert.deepEqual(
    expansion.map((item) => item.id).sort(),
    [...EXPECTED_V12_EXPANSION_IDS].sort(),
  );
  assert.equal(expansion.filter((item) => item.revision === 1).length, 50);
  assert.equal(expansion.filter((item) => item.public.format === "conceptual").length, 12);
  assert.equal(
    expansion.filter((item) => item.public.format === "production-scenario").length,
    38,
  );
  const expectedExpansionPositions = {
    junior: [5, 6, 5],
    mid: [6, 5, 6],
    senior: [6, 6, 5],
  };
  for (const level of LEVELS) {
    const positions = [0, 0, 0];
    for (const item of expansion.filter((candidateItem) => candidateItem.public.level === level)) {
      positions[item.public.options.findIndex(
        (option) => option.id === item.private.correctOptionId,
      )] += 1;
    }
    assert.deepEqual(positions, expectedExpansionPositions[level]);
  }
}

{
  const interviewRoot = path.join(repoRoot, "content-drafts", "interview-mcq");
  const publicPath = path.join(interviewRoot, "reference-set-v1.public.json");
  const privatePath = path.join(interviewRoot, "reference-set-v1.private.json");
  const publicRaw = fs.readFileSync(publicPath, "utf8");
  const privateRaw = fs.readFileSync(privatePath, "utf8");
  const v1Public = JSON.parse(publicRaw);
  const v1Private = JSON.parse(privateRaw);

  assert.equal(crypto.createHash("sha256").update(publicRaw).digest("hex"), V1_FIXTURE_HASHES.public);
  assert.equal(crypto.createHash("sha256").update(privateRaw).digest("hex"), V1_FIXTURE_HASHES.private);
  assert.equal(v1Public.schemaVersion, "1.0.0");
  assert.equal(v1Private.schemaVersion, "1.0.0");
  assert.equal(v1Public.items.length, 5);
  assert.deepEqual(
    v1Private.items.map((item) => item.id).sort(),
    v1Public.items.map((item) => item.id).sort(),
  );

  const v1ById = new Map(v1Public.items.map((item) => [item.id, item]));
  const migratedEntries = loadAuthoringItems(path.join(interviewRoot, "items"))
    .filter(({ item }) => v1ById.has(item.id));
  assert.equal(migratedEntries.length, 5);
  assert.equal(new Set(migratedEntries.map(({ item }) => item.id)).size, 5);

  for (const { item } of migratedEntries) {
    const reference = v1ById.get(item.id);
    assert.ok(item.revision >= 2, `${item.id} must retain its revision-2-or-later migration lineage`);
    assert.equal(item.public.technology, reference.technology, `${item.id} technology drifted`);
    assert.equal(item.public.level, reference.level, `${item.id} level drifted`);
    assert.equal(item.public.format, reference.format, `${item.id} format drifted`);
  }
}

function copy(value) {
  return structuredClone(value);
}

function sequenceOption(id, label) {
  return {
    id: `choice-${crypto.createHash("sha256").update(id).digest("hex").slice(0, 10)}`,
    label,
  };
}

function syntheticOptionId(seed) {
  return sequenceOption(seed, "unused").id;
}

function makeOptions(itemNumber, correctPosition, format) {
  const suffix = String(itemNumber).padStart(2, "0");
  if (format === "code-output") {
    const expected = `start-${suffix} → finish-${suffix}`;
    const candidates = [
      sequenceOption(`sync-then-microtask-${suffix}`, expected),
      sequenceOption(`microtask-before-sync-${suffix}`, `finish-${suffix} → start-${suffix}`),
      sequenceOption(`duplicate-sync-order-${suffix}`, `start-${suffix} → start-${suffix}`),
    ];
    const correct = candidates.shift();
    candidates.splice(correctPosition, 0, correct);
    return candidates;
  }

  const candidates = [
    sequenceOption(`route-alpha-${suffix}`, `Choose route alpha ${suffix} for boundary.`),
    sequenceOption(`route-bravo-${suffix}`, `Choose route bravo ${suffix} for boundary.`),
    sequenceOption(`route-delta-${suffix}`, `Choose route delta ${suffix} for boundary.`),
  ];
  const correct = candidates.shift();
  candidates.splice(correctPosition, 0, correct);
  return candidates;
}

function makeItem({ itemNumber, level, format, technology, band, correctPosition }) {
  const suffix = String(itemNumber).padStart(2, "0");
  const id = `synthetic-${technology}-${level}-${suffix}`;
  const sourceId = `official-source-${suffix}`;
  const options = makeOptions(itemNumber, correctPosition, format);
  const correctOptionId = syntheticOptionId(`route-alpha-${suffix}`);
  const actualCorrectOptionId = format === "code-output"
    ? syntheticOptionId(`sync-then-microtask-${suffix}`)
    : correctOptionId;
  const item = {
    schemaVersion: "2.0.0",
    id,
    revision: 1,
    author: {
      id: "synthetic-author",
      type: "ai",
      authoredAt: "2026-07-22",
    },
    public: {
      technology,
      level,
      difficultyBand: band,
      format,
      competency: `synthetic-competency-${suffix}`,
      prompt: `Nebula${suffix} quartz${suffix} zephyr${suffix} asks whether route${suffix} protects boundary${suffix} during deployment${suffix}.`,
      options,
      estimatedSeconds: 60,
    },
    private: {
      correctOptionId: actualCorrectOptionId,
      answerProof: {
        summary: `The keyed route for synthetic item ${suffix} is the only choice that preserves its stated boundary.`,
        decisiveConstraints: [`The synthetic boundary ${suffix} must remain intact.`],
        claims: [{
          statement: `The official source supports the contract used by synthetic item ${suffix}.`,
          sourceIds: [sourceId],
        }],
      },
      optionRationales: options.map((option) => {
        const isCorrect = option.id === actualCorrectOptionId;
        return {
          optionId: option.id,
          verdict: isCorrect ? "correct" : "incorrect",
          explanation: isCorrect
            ? `This choice preserves the complete synthetic contract for item ${suffix}.`
            : `This choice violates one decisive synthetic constraint for item ${suffix}.`,
          misconceptionTag: isCorrect ? null : `mistake-${option.id}`,
          plausibility: isCorrect ? null : "The choice resembles a familiar implementation pattern.",
          falsifyingConstraint: isCorrect ? null : `The boundary requirement for item ${suffix} rules this choice out.`,
        };
      }),
      remediationTopics: [`Synthetic topic ${suffix}`],
      learnMore: [{
        title: `MDN synthetic reference ${suffix}`,
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        sourceId,
      }],
      provenance: {
        wordingOrigin: "original",
        copiedText: false,
        relatedContentIds: [],
        sources: [{
          id: sourceId,
          title: `MDN synthetic reference ${suffix}`,
          url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
          role: "technical-verification",
          licenseId: "CC-BY-SA-2.5",
          licenseUrl: "https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Attrib_copyright_license",
          retrievedAt: "2026-07-22",
          revision: `synthetic-revision-${suffix}`,
          official: true,
          copiedText: false,
        }],
      },
    },
  };
  if (format === "code-output") {
    item.public.code = {
      language: "javascript",
      runtime: "browser",
      source: `console.log('start-${suffix}'); queueMicrotask(() => console.log('finish-${suffix}'));`,
    };
    item.private.verification = {
      kind: "browser-console-output",
      expectedOutput: [`start-${suffix}`, `finish-${suffix}`],
    };
  }
  return item;
}

function makeCandidateContext() {
  const items = [];
  let itemNumber = 0;
  for (const level of LEVELS) {
    const formatDistribution = blueprint.distributions.formatByLevel[level];
    const formats = [
      ...Array(formatDistribution['code-output']).fill('code-output'),
      ...Array(formatDistribution.conceptual).fill('conceptual'),
      ...Array(formatDistribution['production-scenario']).fill('production-scenario'),
    ];
    const technologyDistribution = blueprint.distributions.technologyByLevel[level];
    const nonOutputTechnologies = Object.entries(technologyDistribution)
      .flatMap(([technology, count]) => Array(
        technology === "javascript" ? count - blueprint.codeOutputConstraint.count / LEVELS.length : count,
      ).fill(technology));
    const bands = repeatedDistribution(blueprint.distributions.difficultyBandByLevel[level]);
    let nonOutputIndex = 0;
    formats.forEach((format, levelIndex) => {
      itemNumber += 1;
      const technology = format === "code-output"
        ? "javascript"
        : nonOutputTechnologies[nonOutputIndex++];
      items.push(makeItem({
        itemNumber,
        level,
        format,
        technology,
        band: bands[levelIndex],
        correctPosition: (itemNumber - 1) % 3,
      }));
    });
  }

  const itemEntries = items.map((item) => ({
    item,
    filePath: path.join("/synthetic/items", item.public.technology, `${item.id}.authoring.json`),
  }));
  const manifest = {
    schemaVersion: "2.0.0",
    manifestId: "bank-v1",
    bankId: blueprint.bankId,
    bankVersion: "1.2.0",
    status: "candidate",
    language: "en",
    blueprintId: blueprint.blueprintId,
    itemRefs: items.map((item) => ({ id: item.id, revision: item.revision })),
  };
  const reviews = {
    schemaVersion: "2.0.0",
    bankId: manifest.bankId,
    bankVersion: manifest.bankVersion,
    status: manifest.status,
    items: items.map((item) => {
      const contentHash = contentHashForItem(item);
      const stage = (reviewer, reviewerType) => ({
        status: "passed",
        reviewer,
        reviewerType,
        reviewedAt: "2026-07-22",
        reviewedRevision: item.revision,
        contentHash,
        checklistVersion: policies.quality.checklistVersion,
        notes: ["Synthetic review evidence."],
      });
      return {
        id: item.id,
        revision: item.revision,
        contentHash,
        technical: {
          ...stage("technical-reviewer", "ai"),
          verifiedCorrectOptionId: item.private.correctOptionId,
          rejectedDistractorOptionIds: item.public.options
            .filter((option) => option.id !== item.private.correctOptionId)
            .map((option) => option.id),
          verifiedSourceIds: [item.private.provenance.sources[0].id],
        },
        editorial: {
          ...stage("editorial-reviewer", "human"),
          originalityConfirmed: true,
          oneBestAnswerConfirmed: true,
          parallelOptionsConfirmed: true,
          clueFlags: [],
        },
        blind: {
          ...stage("blind-reviewer", "ai-assisted"),
          selectedOptionId: item.private.correctOptionId,
          confidence: "high",
          alternativeValidOptionIds: [],
          clueFlags: [],
          assessedLevel: item.public.level,
          assessedDifficultyBand: item.public.difficultyBand,
        },
        waivers: [],
      };
    }),
    finalApproval: null,
  };
  return { itemEntries, manifest, reviews, blueprint: copy(blueprint), policies: copy(policies) };
}

function bankHash(context) {
  return bankContentHash(context.itemEntries.map(({ item }) => ({
    id: item.id,
    revision: item.revision,
    contentHash: contentHashForItem(item),
  })));
}

function promoteToEditorialGold(context) {
  context.manifest.status = "editorial-gold";
  context.reviews.status = "editorial-gold";
  context.reviews.finalApproval = {
    approvedBy: "bank-approver",
    approvedAt: "2026-07-22",
    bankVersion: context.manifest.bankVersion,
    bankContentHash: bankHash(context),
    notes: [],
  };
}

async function validate(context, options = {}) {
  return validateInterviewBank(context, {
    executeBrowser: false,
    now: NOW,
    ...options,
  });
}

function expectError(result, expected) {
  assert.match(result.errors.join("\n"), expected);
}

const candidate = makeCandidateContext();
assert.equal(candidate.itemEntries.length, 170);
assert.deepEqual((await validate(candidate)).errors, []);
expectError(await validate(candidate, { requireGold: true }), /gold lint requires/);

{
  const weakenedWithoutChecklistBump = copy(candidate);
  const checklistVersion = weakenedWithoutChecklistBump.policies.quality.checklistVersion;
  weakenedWithoutChecklistBump.policies.quality.reviewRules.optionLengthClue
    .relativeDeviationFromDistractorMedian = 0.16;
  assert.equal(
    weakenedWithoutChecklistBump.policies.quality.checklistVersion,
    checklistVersion,
  );
  expectError(
    await validate(weakenedWithoutChecklistBump),
    /relativeDeviationFromDistractorMedian: must remain exactly 0\.15/,
  );
}

{
  const incompleteChecklist = copy(candidate);
  incompleteChecklist.policies.quality.checklistScope.blind = [];
  expectError(
    await validate(incompleteChecklist),
    /quality\.checklistScope\.blind: must contain at least three non-empty checks/,
  );
}

{
  const weakenedReviewIntegrity = copy(candidate);
  weakenedReviewIntegrity.policies.quality.reviewIntegrity.stageReviewersMustBeDistinct = false;
  expectError(
    await validate(weakenedReviewIntegrity),
    /quality\.reviewIntegrity: must require all three independent/,
  );
}

{
  const weakenedDifficultyPolicy = copy(candidate);
  weakenedDifficultyPolicy.policies.quality.difficultyRubric
    .perItemLevelDisagreementPolicy = "blocker";
  expectError(
    await validate(weakenedDifficultyPolicy),
    /quality\.difficultyRubric: must retain warning-level per-item blind level and band disagreements/,
  );
}

{
  const weakenedOptionContract = copy(candidate);
  weakenedOptionContract.policies.quality.options.count = 4;
  weakenedOptionContract.policies.quality.options.permutationsRequired = 24;
  weakenedOptionContract.policies.quality.reviewRules.optionSimilarity.reviewThreshold = 0.81;
  weakenedOptionContract.policies.quality.reviewRules.optionSimilarity.exemptFormats = [];
  weakenedOptionContract.policies.quality.reviewRules.optionSimilarity.waivable = true;
  weakenedOptionContract.policies.quality.reviewRules.optionLengthClue.metric = "raw-characters";
  weakenedOptionContract.policies.quality.reviewRules.absoluteWording.terms = [];
  weakenedOptionContract.policies.quality.reviewRules.stemEchoClue.minimumContentWordNgram = 99;
  const result = await validate(weakenedOptionContract);
  expectError(result, /quality\.options\.count: must remain exactly 3/);
  expectError(result, /quality\.options\.permutationsRequired: must remain exactly 6/);
  expectError(result, /optionSimilarity\.reviewThreshold: must remain exactly 0\.8/);
  expectError(result, /optionSimilarity\.exemptFormats: must exempt exactly code-output/);
  expectError(result, /optionSimilarity\.waivable: must remain false/);
  expectError(result, /optionLengthClue\.metric: must match the validator's normalized visible-length metric/);
  expectError(result, /absoluteWording\.terms: must remain exactly always and never/);
  expectError(result, /stemEchoClue\.minimumContentWordNgram: must remain exactly 3/);
}

{
  const weakenedCalibration = copy(candidate);
  weakenedCalibration.policies.quality.calibration.minimumMatchingLevelAttempts = 99;
  weakenedCalibration.policies.quality.calibration.discriminationIndex.minimum = 0.19;
  weakenedCalibration.policies.quality.calibration.distractorSelectionRate.minimum = 0.049;
  const result = await validate(weakenedCalibration);
  expectError(result, /minimumMatchingLevelAttempts: must remain at least 100/);
  expectError(result, /discriminationIndex\.minimum: must remain at least 0\.2/);
  expectError(result, /distractorSelectionRate\.minimum: must remain at least 0\.05/);
}

{
  const weakenedSources = copy(candidate);
  weakenedSources.policies.sources.minimumOfficialTechnicalSourcesPerItem = 0;
  weakenedSources.policies.sources.allowedLicenseIds.push("Proprietary");
  weakenedSources.policies.sources.officialDomains[0].licenseRules[0].licenseId = "MIT";
  weakenedSources.policies.sources.officialDomains[0].freshnessDays = 366;
  const piniaSourceDomain = weakenedSources.policies.sources.officialDomains.find(
    (domain) => domain.hostname === "pinia.vuejs.org",
  );
  assert.ok(piniaSourceDomain);
  piniaSourceDomain.licenseRules[0].licenseUrl = "https://pinia.vuejs.org/license";
  weakenedSources.policies.sources.officialDomains.push({
    hostname: "unapproved.example",
    sourceClass: "framework",
    freshnessDays: 365,
    licenseRules: [{
      licenseId: "MIT",
      licenseUrl: "https://unapproved.example/license",
    }],
  });
  const result = await validate(weakenedSources);
  expectError(result, /minimumOfficialTechnicalSourcesPerItem: must remain at least 1/);
  expectError(result, /allowedLicenseIds: must contain exactly the approved open-license identifiers/);
  expectError(result, /must contain exactly the approved MDN, React, Angular, Angular v17, Vue, and Pinia hosts/);
  expectError(result, /developer\.mozilla\.org\.licenseRules: must match the approved official license mapping exactly/);
  expectError(result, /developer\.mozilla\.org\.freshnessDays: must be a positive integer no greater than 365/);
  expectError(result, /pinia\.vuejs\.org\.licenseRules: must match the approved official license mapping exactly/);
}

{
  const weakenedRuntime = copy(candidate);
  const browser = weakenedRuntime.policies.runtimes.profiles.find(
    (profile) => profile.id === "browser",
  );
  browser.networkAccess = true;
  browser.fileSystemAccess = true;
  browser.dynamicCodeGeneration = true;
  browser.timeoutMs = 1501;
  browser.maxOutputBytes = 65_537;
  const result = await validate(weakenedRuntime);
  expectError(result, /browser\.networkAccess: network must remain disabled/);
  expectError(result, /browser\.fileSystemAccess: filesystem must remain disabled/);
  expectError(result, /browser\.dynamicCodeGeneration: dynamic-code generation must remain disabled/);
  expectError(result, /browser\.timeoutMs: must be a positive integer no greater than 1500/);
  expectError(result, /browser\.maxOutputBytes: must be a positive integer no greater than 65536/);
}

{
  const malformedPolicies = copy(candidate);
  malformedPolicies.policies.quality.reviewRules = null;
  const result = await validate(malformedPolicies);
  expectError(result, /quality\.reviewRules: must be an object/);
  assert.doesNotMatch(result.errors.join("\n"), /TypeError/);
}

{
  const missingPolicyBundle = copy(candidate);
  missingPolicyBundle.policies = null;
  const result = await validate(missingPolicyBundle);
  expectError(result, /policies\.root: quality, source, and runtime policies are required objects/);
  assert.doesNotMatch(result.errors.join("\n"), /TypeError/);
}

{
  const malformedRuntimePatterns = copy(candidate);
  malformedRuntimePatterns.policies.runtimes.runtimePatterns = [{
    id: "broken-pattern",
    technology: "react",
    pattern: "[",
  }];
  expectError(
    await validate(malformedRuntimePatterns),
    /runtimePatterns\.broken-pattern\.pattern: must be a valid regular expression/,
  );
}

{
  const reorderedBlueprint = copy(candidate);
  reorderedBlueprint.blueprint.selectionPolicy = Object.fromEntries(
    Object.entries(reorderedBlueprint.blueprint.selectionPolicy).reverse(),
  );
  reorderedBlueprint.blueprint.codeOutputConstraint = Object.fromEntries(
    Object.entries(reorderedBlueprint.blueprint.codeOutputConstraint).reverse(),
  );
  assert.deepEqual((await validate(reorderedBlueprint)).errors, []);
}

{
  const missingReviewerType = copy(candidate);
  delete missingReviewerType.reviews.items[0].technical.reviewerType;
  expectError(await validate(missingReviewerType), /reviewerType/);
}

{
  const authorReviewed = copy(candidate);
  const item = authorReviewed.itemEntries[0].item;
  authorReviewed.reviews.items[0].technical.reviewer = item.author.id;
  expectError(
    await validate(authorReviewed),
    /technical reviewer must differ from the author/,
  );

  const sharedReviewer = copy(candidate);
  sharedReviewer.reviews.items[0].blind.reviewer =
    sharedReviewer.reviews.items[0].editorial.reviewer;
  expectError(
    await validate(sharedReviewer),
    /technical, editorial, and blind reviewers must be independent/,
  );

  const provisionalPassedReview = copy(candidate);
  provisionalPassedReview.reviews.items[0].blind.notes = [
    "Provisional review; replace after independent assessment.",
  ];
  expectError(
    await validate(provisionalPassedReview),
    /blind passed review retains provisional evidence/,
  );
}

{
  const staleChecklist = copy(candidate);
  staleChecklist.reviews.items[0].technical.checklistVersion = "1.0.0";
  expectError(await validate(staleChecklist), /does not use the current quality checklist/);
}

{
  const technicalMismatch = copy(candidate);
  const review = technicalMismatch.reviews.items[0];
  const item = technicalMismatch.itemEntries[0].item;
  review.technical.verifiedCorrectOptionId = item.public.options.find(
    (option) => option.id !== item.private.correctOptionId,
  ).id;
  expectError(await validate(technicalMismatch), /verifiedCorrectOptionId does not match/);

  review.technical.verifiedCorrectOptionId = item.private.correctOptionId;
  review.technical.rejectedDistractorOptionIds = [
    item.private.correctOptionId,
    review.technical.rejectedDistractorOptionIds[0],
  ];
  expectError(await validate(technicalMismatch), /reject exactly the two keyed distractors/);

  review.technical.rejectedDistractorOptionIds = item.public.options
    .filter((option) => option.id !== item.private.correctOptionId)
    .map((option) => option.id);
  review.technical.verifiedSourceIds = ["unknown-source"];
  const result = await validate(technicalMismatch);
  expectError(result, /references unknown source/);
  expectError(result, /must verify every official source cited by the answer proof/);
}

{
  const editorialMismatch = copy(candidate);
  editorialMismatch.reviews.items[0].editorial.oneBestAnswerConfirmed = false;
  editorialMismatch.reviews.items[0].editorial.clueFlags = ["length clue remains"];
  const result = await validate(editorialMismatch);
  expectError(result, /requires all quality confirmations/);
  expectError(result, /may not retain clue flags/);
}

{
  const blindMismatch = copy(candidate);
  const review = blindMismatch.reviews.items[0].blind;
  const item = blindMismatch.itemEntries[0].item;
  review.selectedOptionId = item.public.options.find(
    (option) => option.id !== item.private.correctOptionId,
  ).id;
  review.alternativeValidOptionIds = [item.private.correctOptionId];
  review.clueFlags = ["answer length"];
  review.assessedDifficultyBand = item.public.difficultyBand === "core" ? "stretch" : "core";
  const result = await validate(blindMismatch);
  expectError(result, /must independently select the keyed option/);
  expectError(result, /may not identify alternative valid options/);
  expectError(result, /may not retain clue flags/);
  assert.match(
    result.warnings.join("\n"),
    /blind assessedDifficultyBand .* differs from authored/,
  );
}

{
  const blindLevelSwap = copy(candidate);
  const first = blindLevelSwap.itemEntries.find(
    ({ item }) => item.public.technology === "javascript"
      && item.public.level === "junior"
      && item.public.difficultyBand === "foundation"
      && item.public.format === "code-output",
  ).item;
  const second = blindLevelSwap.itemEntries.find(
    ({ item }) => item.public.technology === "javascript"
      && item.public.level === "mid"
      && item.public.difficultyBand === "foundation"
      && item.public.format === "code-output",
  ).item;
  blindLevelSwap.reviews.items.find((review) => review.id === first.id)
    .blind.assessedLevel = "mid";
  blindLevelSwap.reviews.items.find((review) => review.id === second.id)
    .blind.assessedLevel = "junior";
  const result = await validate(blindLevelSwap);
  assert.deepEqual(result.errors, []);
  assert.equal(
    result.warnings.filter((warning) => warning.includes("blind assessedLevel")).length,
    2,
  );

  const brokenBlindCohort = copy(candidate);
  brokenBlindCohort.reviews.items[0].blind.assessedLevel =
    brokenBlindCohort.itemEntries[0].item.public.level === "junior" ? "mid" : "junior";
  expectError(
    await validate(brokenBlindCohort),
    /blind assessed levels must preserve the exact blueprint cohorts/,
  );
}

{
  const lowConfidenceBlind = copy(candidate);
  lowConfidenceBlind.reviews.items[0].blind.confidence = "low";
  expectError(await validate(lowConfidenceBlind), /may not retain low confidence/);
}

{
  const browserResult = await validate(candidate, { executeBrowser: true });
  assert.deepEqual(browserResult.errors, []);
}

{
  const wrongOutput = copy(candidate);
  const item = wrongOutput.itemEntries.find(
    (entry) => entry.item.public.format === "code-output",
  ).item;
  item.private.verification.expectedOutput[0] = "unexpected-output";
  const review = wrongOutput.reviews.items.find((entry) => entry.id === item.id);
  const contentHash = contentHashForItem(item);
  review.contentHash = contentHash;
  for (const stage of [review.technical, review.editorial, review.blind]) stage.contentHash = contentHash;
  expectError(
    await validate(wrongOutput, { executeBrowser: true }),
    /browser output .* does not match/,
  );
}

{
  const template = candidate.itemEntries.find(
    (entry) => entry.item.public.format === "code-output",
  ).item;
  const runtimeErrorItem = copy(template);
  runtimeErrorItem.id = `${template.id}-pageerror`;
  runtimeErrorItem.public.code.source = `setTimeout(() => {
  throw new Error("pageerror-sentinel");
}, 0);`;

  const timeoutItem = copy(template);
  timeoutItem.id = `${template.id}-timeout`;
  timeoutItem.public.code.source = `const stopAt = performance.now() + 350;
while (performance.now() < stopAt) {}
console.log("completed-after-deadline");`;

  const runtimePolicies = copy(policies.runtimes);
  runtimePolicies.profiles.find((profile) => profile.id === "browser").timeoutMs = 150;
  const errors = [];
  await verifyBrowserConsoleOutputs(
    [runtimeErrorItem, timeoutItem],
    runtimePolicies,
    errors,
  );
  assert.match(
    errors.join("\n"),
    new RegExp(`${runtimeErrorItem.id}: browser verification failed: pageerror-sentinel`),
  );
  assert.match(
    errors.join("\n"),
    new RegExp(`${timeoutItem.id}: browser verification failed: execution exceeded 150ms`),
  );
}

{
  const changed = copy(candidate);
  changed.itemEntries[0].item.public.prompt += " Material edit.";
  expectError(await validate(changed), /review entry is not bound to the current revision\/contentHash/);
}

{
  const leaked = copy(candidate);
  leaked.itemEntries[0].item.public.correctOptionId = "leaked-answer";
  expectError(await validate(leaked), /additional properties|private key leaked/);
}

{
  const semanticOptionId = copy(candidate);
  semanticOptionId.itemEntries[0].item.public.options[0].id = "semantic-answer-id";
  expectError(await validate(semanticOptionId), /must match pattern/);
}

{
  const lengthClue = copy(candidate);
  const item = lengthClue.itemEntries[2].item;
  item.public.options.find((option) => option.id === item.private.correctOptionId).label +=
    " This keyed answer now contains a conspicuously excessive amount of extra detail.";
  const review = lengthClue.reviews.items.find((entry) => entry.id === item.id);
  const contentHash = contentHashForItem(item);
  review.contentHash = contentHash;
  for (const stage of [review.technical, review.editorial, review.blind]) stage.contentHash = contentHash;
  expectError(await validate(lengthClue), /correct-option length differs/);
}

{
  const stemEcho = copy(candidate);
  const item = stemEcho.itemEntries[2].item;
  const correct = item.public.options.find((option) => option.id === item.private.correctOptionId);
  const echoedPhrase = correct.label.split(" ").slice(0, 5).join(" ");
  item.public.prompt += ` The preferred wording is: ${echoedPhrase}`;
  const review = stemEcho.reviews.items.find((entry) => entry.id === item.id);
  const contentHash = contentHashForItem(item);
  review.contentHash = contentHash;
  for (const stage of [review.technical, review.editorial, review.blind]) {
    stage.contentHash = contentHash;
  }
  expectError(await validate(stemEcho), /correct option uniquely echoes the stem phrase/);
}

{
  const sharedStemDifferentCode = copy(candidate);
  sharedStemDifferentCode.itemEntries[1].item.public.prompt =
    sharedStemDifferentCode.itemEntries[0].item.public.prompt;
  sharedStemDifferentCode.itemEntries[1].item.public.code.source =
    "document.body.dataset.phase = 'omega'; setTimeout(() => console.log('timer-omega'), 0);";
  const result = await validate(sharedStemDifferentCode);
  assert.doesNotMatch(result.errors.join("\n"), /question material (?:duplicates|is near-duplicate)/);
}

{
  const duplicate = copy(candidate);
  duplicate.itemEntries[1].item.public.prompt = duplicate.itemEntries[0].item.public.prompt;
  duplicate.itemEntries[1].item.public.code.source =
    duplicate.itemEntries[0].item.public.code.source;
  expectError(await validate(duplicate), /question material duplicates/);
}

{
  const duplicateCrossItemOption = copy(candidate);
  const [sourceEntry, targetEntry] = duplicateCrossItemOption.itemEntries
    .filter(({ item }) => item.public.format !== "code-output")
    .slice(0, 2);
  targetEntry.item.public.options[1].label = sourceEntry.item.public.options[1].label;
  const review = duplicateCrossItemOption.reviews.items.find(
    (entry) => entry.id === targetEntry.item.id,
  );
  const contentHash = contentHashForItem(targetEntry.item);
  review.contentHash = contentHash;
  for (const stage of [review.technical, review.editorial, review.blind]) {
    stage.contentHash = contentHash;
  }
  expectError(await validate(duplicateCrossItemOption), /duplicates option wording from/);
}

{
  const duplicateOptionId = copy(candidate);
  const sourceId = duplicateOptionId.itemEntries[0].item.public.options[1].id;
  const targetItem = duplicateOptionId.itemEntries[1].item;
  const oldId = targetItem.public.options[0].id;
  targetItem.public.options[0].id = sourceId;
  targetItem.private.optionRationales.find((entry) => entry.optionId === oldId).optionId = sourceId;
  const review = duplicateOptionId.reviews.items.find((entry) => entry.id === targetItem.id);
  review.technical.rejectedDistractorOptionIds =
    review.technical.rejectedDistractorOptionIds.map((id) => id === oldId ? sourceId : id);
  const contentHash = contentHashForItem(targetItem);
  review.contentHash = contentHash;
  for (const stage of [review.technical, review.editorial, review.blind]) {
    stage.contentHash = contentHash;
  }
  expectError(await validate(duplicateOptionId), /option IDs must be globally unique/);
}

{
  const duplicateCompetency = copy(candidate);
  const [first, second] = duplicateCompetency.itemEntries
    .filter(({ item }) => item.public.technology === "javascript")
    .slice(0, 2);
  second.item.public.competency = first.item.public.competency;
  const review = duplicateCompetency.reviews.items.find(
    (entry) => entry.id === second.item.id,
  );
  const contentHash = contentHashForItem(second.item);
  review.contentHash = contentHash;
  for (const stage of [review.technical, review.editorial, review.blind]) {
    stage.contentHash = contentHash;
  }
  expectError(await validate(duplicateCompetency), /distinct competency coverage/);
}

{
  const skewedLevelTechnology = copy(candidate);
  const juniorReact = skewedLevelTechnology.itemEntries.find(
    ({ item }) => item.public.level === "junior"
      && item.public.technology === "react"
      && !item.public.code,
  );
  const midAngular = skewedLevelTechnology.itemEntries.find(
    ({ item }) => item.public.level === "mid"
      && item.public.technology === "angular"
      && !item.public.code,
  );
  juniorReact.item.public.technology = "angular";
  midAngular.item.public.technology = "react";
  for (const { item } of [juniorReact, midAngular]) {
    const review = skewedLevelTechnology.reviews.items.find((entry) => entry.id === item.id);
    const contentHash = contentHashForItem(item);
    review.contentHash = contentHash;
    for (const stage of [review.technical, review.editorial, review.blind]) {
      stage.contentHash = contentHash;
    }
  }
  expectError(await validate(skewedLevelTechnology), /technology distribution mismatch/);
  expectError(await validate(skewedLevelTechnology), /eligible interview pool is/);
}

{
  const badSource = copy(candidate);
  badSource.itemEntries[0].item.private.provenance.sources[0].licenseId = "Proprietary";
  expectError(await validate(badSource), /unsupported licenseId/);
}

{
  const wrongDomainLicense = copy(candidate);
  const source = wrongDomainLicense.itemEntries[0].item.private.provenance.sources[0];
  source.licenseId = "MIT";
  expectError(
    await validate(wrongDomainLicense),
    /license MIT .* is not allowed for official host developer\.mozilla\.org/,
  );
}

{
  const unsupportedClaimEvidence = copy(candidate);
  const item = unsupportedClaimEvidence.itemEntries[0].item;
  item.private.provenance.sources.push({
    id: "format-seed",
    title: "Open format seed",
    url: "https://github.com/example/interview-format",
    role: "format-inspiration",
    licenseId: "MIT",
    licenseUrl: "https://github.com/example/interview-format/blob/main/LICENSE",
    retrievedAt: "2026-07-22",
    revision: "example@abc123",
    official: false,
    copiedText: false,
  });
  item.private.answerProof.claims[0].sourceIds = ["format-seed"];
  const review = unsupportedClaimEvidence.reviews.items.find((entry) => entry.id === item.id);
  const contentHash = contentHashForItem(item);
  review.contentHash = contentHash;
  for (const stage of [review.technical, review.editorial, review.blind]) {
    stage.contentHash = contentHash;
  }
  expectError(
    await validate(unsupportedClaimEvidence),
    /every answer-proof claim must cite at least one official technical-verification source/,
  );
}

{
  const gold = copy(candidate);
  promoteToEditorialGold(gold);
  assert.deepEqual((await validate(gold, { requireGold: true })).errors, []);

  const prematureApproval = copy(gold);
  prematureApproval.reviews.finalApproval.approvedAt = "2026-07-21";
  expectError(
    await validate(prematureApproval, { requireGold: true }),
    /final approval may not predate an item review/,
  );
}

{
  const calibrated = copy(candidate);
  promoteToEditorialGold(calibrated);
  calibrated.manifest.status = "calibrated-gold";
  calibrated.reviews.status = "calibrated-gold";
  for (const { item } of calibrated.itemEntries) {
    item.private.calibration = {
      status: "measured",
      matchingLevelAttempts: 100,
      difficultyIndex: 0.6,
      discriminationIndex: 0.3,
      optionSelectionRates: item.public.options.map((option) => ({
        optionId: option.id,
        rate: option.id === item.private.correctOptionId ? 0.6 : 0.2,
      })),
      measuredAt: "2026-07-22",
    };
  }
  assert.deepEqual((await validate(calibrated, { requireGold: true })).errors, []);
  calibrated.itemEntries[0].item.private.calibration.matchingLevelAttempts = 99;
  expectError(await validate(calibrated, { requireGold: true }), /at least 100 matching-level attempts/);

  const inconsistentDifficulty = copy(calibrated);
  inconsistentDifficulty.itemEntries[0].item.private.calibration.matchingLevelAttempts = 100;
  inconsistentDifficulty.itemEntries[0].item.private.calibration.difficultyIndex = 0.5;
  expectError(
    await validate(inconsistentDifficulty, { requireGold: true }),
    /difficultyIndex must equal the keyed option selection rate/,
  );

  const waivedWeakDistractor = copy(calibrated);
  const weakItem = waivedWeakDistractor.itemEntries[0].item;
  weakItem.private.calibration.matchingLevelAttempts = 100;
  weakItem.private.calibration.difficultyIndex = 0.75;
  weakItem.private.calibration.optionSelectionRates = weakItem.public.options.map((option, index) => ({
    optionId: option.id,
    rate: option.id === weakItem.private.correctOptionId ? 0.75 : index === 1 ? 0.04 : 0.21,
  }));
  waivedWeakDistractor.reviews.items.find((entry) => entry.id === weakItem.id).waivers.push({
    ruleId: "calibration-distractor-selection-rate",
    reason: "This synthetic waiver must not bypass a non-functioning distractor requirement.",
    reviewer: "calibration-reviewer",
    reviewedAt: "2026-07-22",
    revision: weakItem.revision,
    contentHash: contentHashForItem(weakItem),
  });
  expectError(
    await validate(waivedWeakDistractor, { requireGold: true }),
    /distractor selection rate is below 5%/,
  );

  const prematureCalibration = copy(calibrated);
  prematureCalibration.itemEntries[0].item.private.calibration.matchingLevelAttempts = 100;
  prematureCalibration.itemEntries[0].item.private.calibration.measuredAt = "2026-07-21";
  expectError(
    await validate(prematureCalibration, { requireGold: true }),
    /calibration must be measured on or after editorial approval/,
  );
}

{
  assert.doesNotThrow(() => assertSafeInterviewBankOutputDir(
    path.join(repoRoot, "content-drafts", "interview-mcq", "generated"),
  ));
  assert.throws(
    () => assertSafeInterviewBankOutputDir(path.join(repoRoot, "cdn", "interview-bank")),
    /output must stay under/,
  );
  assert.throws(
    () => assertInterviewBankLifecycleOutputDir(
      path.join(repoRoot, "content-drafts", "interview-mcq", "generated"),
      candidate.manifest,
    ),
    /Candidate interview-bank output must use/,
  );
  assert.doesNotThrow(() => assertInterviewBankLifecycleOutputDir(
    path.join(
      repoRoot,
      "content-drafts",
      "interview-mcq",
      "generated",
      "candidate-1.2.0",
    ),
    candidate.manifest,
  ));

  const nestedLeak = copy(candidate.itemEntries[0].item);
  nestedLeak.public.options[0].correctOptionId = "nested-answer-leak";
  nestedLeak.public.options[0].rationale = "nested-rationale-leak";
  if (nestedLeak.public.code) nestedLeak.public.code.expectedOutput = ["nested-output-leak"];
  const nestedProjection = JSON.stringify(projectPublicItem(nestedLeak));
  assert.doesNotMatch(nestedProjection, /nested-(?:answer|rationale|output)-leak/);

  const items = candidate.itemEntries.map((entry) => ({ item: entry.item }));
  const hashFixture = copy(items[0].item);
  const originalHash = contentHashForItem(hashFixture);
  hashFixture.author.id = "different-author";
  hashFixture.private.calibration = { status: "pending" };
  assert.equal(contentHashForItem(hashFixture), originalHash);
  hashFixture.public.prompt += " Substantive change.";
  assert.notEqual(contentHashForItem(hashFixture), originalHash);

  const first = buildGeneratedPackages({
    items,
    manifest: candidate.manifest,
    reviews: candidate.reviews,
    blueprint: candidate.blueprint,
  });
  const second = buildGeneratedPackages({
    items: [...items].reverse(),
    manifest: candidate.manifest,
    reviews: candidate.reviews,
    blueprint: candidate.blueprint,
  });
  assert.deepEqual(first.files, second.files);
  assert.equal(JSON.stringify(first.publicPackage).includes("correctOptionId"), false);
  assert.equal(first.privatePackage.finalApproval, null);
  assert.equal(first.privatePackage.items.length, candidate.reviews.items.length);
  assert.deepEqual(
    first.privatePackage.items[0].review,
    candidate.reviews.items.find((review) => review.id === first.privatePackage.items[0].id),
  );
  assert.deepEqual(
    first.publicPackage.items.map((item) => item.id),
    [...first.publicPackage.items.map((item) => item.id)].sort(),
  );

  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "interview-bank-test-"));
  try {
    assert.throws(
      () => syncGeneratedFiles({ "../escaped-private.json": "secret" }, temporaryDirectory),
      /artifact path escapes its output directory/,
    );
    assert.deepEqual(syncGeneratedFiles(first.files, temporaryDirectory), []);
    assert.deepEqual(syncGeneratedFiles(first.files, temporaryDirectory, { check: true }), []);
    const publicPath = path.join(temporaryDirectory, `${candidate.manifest.manifestId}.public.json`);
    fs.appendFileSync(publicPath, " ", "utf8");
    assert.deepEqual(
      syncGeneratedFiles(first.files, temporaryDirectory, { check: true }),
      [publicPath],
    );
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

console.log("[interview-bank-validator.test] ok");
