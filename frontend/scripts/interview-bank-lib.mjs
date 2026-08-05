import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "./content-paths.mjs";

export const interviewBankRoot = path.join(repoRoot, "content-drafts", "interview-mcq");

export const interviewBankDefaults = Object.freeze({
  itemsDir: path.join(interviewBankRoot, "items"),
  reviewsPath: path.join(interviewBankRoot, "reviews", "bank-v1.reviews.json"),
  manifestPath: path.join(interviewBankRoot, "manifests", "bank-v1.manifest.json"),
  blueprintPath: path.join(interviewBankRoot, "blueprints", "bank-v1.blueprint.json"),
  outputDir: path.join(interviewBankRoot, "generated"),
});

export function assertSafeInterviewBankOutputDir(outputDir) {
  const generatedRoot = path.resolve(interviewBankDefaults.outputDir);
  const candidate = path.resolve(outputDir);
  const relative = path.relative(generatedRoot, candidate);
  const staysWithinGeneratedRoot = relative === ""
    || (!relative.startsWith("..") && !path.isAbsolute(relative));
  if (!staysWithinGeneratedRoot) {
    throw new Error(
      `Interview-bank output must stay under ${generatedRoot}; refusing ${candidate}.`,
    );
  }
}

export function assertInterviewBankLifecycleOutputDir(outputDir, manifest) {
  assertSafeInterviewBankOutputDir(outputDir);
  if (manifest?.status !== "candidate") return;

  const expectedCandidateDir = path.resolve(
    interviewBankDefaults.outputDir,
    `candidate-${manifest.bankVersion}`,
  );
  const resolvedOutputDir = path.resolve(outputDir);
  if (resolvedOutputDir !== expectedCandidateDir) {
    throw new Error(
      `Candidate interview-bank output must use ${expectedCandidateDir}; refusing ${resolvedOutputDir}.`,
    );
  }
}

const PUBLIC_ITEM_FIELDS = Object.freeze([
  "technology",
  "level",
  "difficultyBand",
  "format",
  "competency",
  "prompt",
  "estimatedSeconds",
]);

const PUBLIC_CODE_FIELDS = Object.freeze(["language", "runtime", "source"]);
const PUBLIC_OPTION_FIELDS = Object.freeze(["id", "label"]);

const PRIVATE_ITEM_FIELDS = Object.freeze([
  "correctOptionId",
  "optionRationales",
  "answerProof",
  "remediationTopics",
  "learnMore",
  "provenance",
  "verification",
  "calibration",
]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function compareStrings(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isPlainObject(value)) return value;

  return Object.fromEntries(
    Object.keys(value)
      .sort(compareStrings)
      .map((key) => [key, canonicalize(value[key])]),
  );
}

export function canonicalJson(value, { pretty = false } = {}) {
  return `${JSON.stringify(canonicalize(value), null, pretty ? 2 : undefined)}${pretty ? "\n" : ""}`;
}

export function sha256(value) {
  const input = typeof value === "string" || Buffer.isBuffer(value)
    ? value
    : canonicalJson(value);
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function contentHashPayload(item) {
  const privateContent = { ...item.private };
  delete privateContent.calibration;
  return {
    schemaVersion: item.schemaVersion,
    id: item.id,
    revision: item.revision,
    public: item.public,
    private: privateContent,
  };
}

export function contentHashForItem(item) {
  return sha256(contentHashPayload(item));
}

export function bankContentHash(itemRefs) {
  const normalized = itemRefs
    .map(({ id, revision, contentHash }) => ({ id, revision, contentHash }))
    .sort((left, right) => compareStrings(left.id, right.id));
  return sha256(normalized);
}

function collectAuthoringFiles(directory, files = []) {
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectAuthoringFiles(filePath, files);
    } else if (entry.isFile() && entry.name.endsWith(".authoring.json")) {
      files.push(filePath);
    }
  }
  return files;
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function loadAuthoringItems(itemsDir) {
  return collectAuthoringFiles(itemsDir)
    .sort(compareStrings)
    .map((filePath) => ({ filePath, item: readJson(filePath) }));
}

function allowlist(source, fieldNames) {
  return Object.fromEntries(
    fieldNames
      .filter((field) => Object.hasOwn(source, field))
      .map((field) => [field, source[field]]),
  );
}

export function projectPublicItem(item) {
  const projected = {
    id: item.id,
    revision: item.revision,
    ...allowlist(item.public, PUBLIC_ITEM_FIELDS),
  };
  if (item.public.code !== undefined) {
    projected.code = allowlist(item.public.code, PUBLIC_CODE_FIELDS);
  }
  if (Array.isArray(item.public.options)) {
    projected.options = item.public.options.map(
      (option) => allowlist(option, PUBLIC_OPTION_FIELDS),
    );
  }
  return projected;
}

export function projectPrivateItem(item, review = undefined) {
  const projected = {
    id: item.id,
    revision: item.revision,
    contentHash: contentHashForItem(item),
    ...allowlist(item.private, PRIVATE_ITEM_FIELDS),
  };
  if (review !== undefined) projected.review = review;
  return projected;
}

function selectedItems(items, manifest) {
  const byId = new Map(items.map((entry) => [entry.item.id, entry.item]));
  return manifest.itemRefs
    .map((reference) => {
      const item = byId.get(reference.id);
      if (!item) throw new Error(`Manifest references missing authoring item ${reference.id}.`);
      if (item.revision !== reference.revision) {
        throw new Error(
          `${reference.id}: manifest revision ${reference.revision} does not match authoring revision ${item.revision}.`,
        );
      }
      return item;
    })
    .sort((left, right) => compareStrings(left.id, right.id));
}

function artifactName(manifest, kind) {
  return `${manifest.manifestId}.${kind}.json`;
}

export function buildGeneratedPackages({ items, manifest, reviews, blueprint }) {
  const selected = selectedItems(items, manifest);
  const reviewsById = new Map(reviews.items.map((review) => [review.id, review]));
  const itemRefs = selected.map((item) => ({
    id: item.id,
    revision: item.revision,
    contentHash: contentHashForItem(item),
  }));
  const contentHash = bankContentHash(itemRefs);
  const publicPackage = {
    schemaVersion: "2.0.0",
    bankId: manifest.bankId,
    bankVersion: manifest.bankVersion,
    status: manifest.status,
    language: manifest.language,
    items: selected.map(projectPublicItem),
  };
  const privatePackage = {
    schemaVersion: "2.0.0",
    bankId: manifest.bankId,
    bankVersion: manifest.bankVersion,
    status: manifest.status,
    finalApproval: reviews.finalApproval,
    items: selected.map((item) => {
      const review = reviewsById.get(item.id);
      if (!review) throw new Error(`Consolidated review is missing for ${item.id}.`);
      return projectPrivateItem(item, review);
    }),
  };
  const publicText = canonicalJson(publicPackage, { pretty: true });
  const privateText = canonicalJson(privatePackage, { pretty: true });
  const releaseManifest = {
    schemaVersion: "2.0.0",
    manifestId: manifest.manifestId,
    bankId: manifest.bankId,
    bankVersion: manifest.bankVersion,
    blueprintId: blueprint.blueprintId,
    status: manifest.status,
    language: manifest.language,
    itemCount: selected.length,
    totalEstimatedSeconds: selected.reduce(
      (sum, item) => sum + item.public.estimatedSeconds,
      0,
    ),
    contentHash,
    itemRefs,
    finalApproval: reviews.finalApproval,
    artifacts: {
      public: {
        file: artifactName(manifest, "public"),
        sha256: sha256(publicText),
      },
      private: {
        file: artifactName(manifest, "private"),
        sha256: sha256(privateText),
      },
    },
  };

  return {
    publicPackage,
    privatePackage,
    releaseManifest,
    files: {
      [artifactName(manifest, "public")]: publicText,
      [artifactName(manifest, "private")]: privateText,
      [artifactName(manifest, "release")]: canonicalJson(releaseManifest, { pretty: true }),
    },
  };
}

function atomicWrite(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, contents, "utf8");
  fs.renameSync(temporaryPath, filePath);
}

export function syncGeneratedFiles(files, outputDir, { check = false } = {}) {
  const mismatches = [];
  const resolvedOutputDir = path.resolve(outputDir);
  for (const [fileName, expectedContents] of Object.entries(files)) {
    const filePath = path.resolve(resolvedOutputDir, fileName);
    const relative = path.relative(resolvedOutputDir, filePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error(`Generated artifact path escapes its output directory: ${fileName}.`);
    }
    if (check) {
      const actualContents = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
      if (actualContents !== expectedContents) mismatches.push(filePath);
    } else {
      atomicWrite(filePath, expectedContents);
    }
  }
  return mismatches;
}

export function parseCliArgs(argv, defaults = interviewBankDefaults) {
  const result = { ...defaults, check: false, explicitPaths: false };
  const fieldByFlag = {
    "--items-dir": "itemsDir",
    "--manifest": "manifestPath",
    "--reviews": "reviewsPath",
    "--blueprint": "blueprintPath",
    "--output-dir": "outputDir",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      result.check = true;
      continue;
    }
    const field = fieldByFlag[argument];
    if (!field) throw new Error(`Unknown argument: ${argument}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`${argument} requires a path.`);
    result[field] = path.resolve(value);
    result.explicitPaths = true;
    index += 1;
  }
  return result;
}

export function missingBankInputs(paths) {
  return [
    paths.itemsDir,
    paths.manifestPath,
    paths.reviewsPath,
    paths.blueprintPath,
  ].filter((candidate) => !fs.existsSync(candidate));
}
