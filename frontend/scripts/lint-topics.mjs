#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// project root = one level up from /scripts
const projectRoot = path.resolve(__dirname, "..");
const questionsRoot = path.join(projectRoot, "src", "assets", "questions");
const tagRegistryPath = path.join(questionsRoot, "tag-registry.json");
const topicRegistryPath = path.join(questionsRoot, "topic-registry.json");

const args = process.argv.slice(2);
const FIX = args.includes("--fix");
const HELP = args.includes("--help") || args.includes("-h");

const kebabCaseRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function printUsage() {
  console.log(`lint-topics

Usage:
  node scripts/lint-topics.mjs            # report-only (CI)
  node scripts/lint-topics.mjs --fix      # sort + dedupe only

Rules:
  - topic id must be kebab-case
  - topic title must be non-empty
  - topic tags must be kebab-case
  - topic tags must exist in tag-registry.json canonical tags (no aliases)
  - no duplicate tags within a topic
`);
}

function unique(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

function normalizeRegistryForFix(registry) {
  const topics = Array.isArray(registry?.topics) ? registry.topics : [];
  const normalizedTopics = topics
    .filter((t) => t && typeof t === "object")
    .map((t) => {
      const id = typeof t.id === "string" ? t.id : "";
      const title = typeof t.title === "string" ? t.title : "";
      const tags = Array.isArray(t.tags) ? t.tags.filter((x) => typeof x === "string") : [];
      const nextTags = unique(tags).slice().sort();
      return { ...t, id, title, tags: nextTags };
    })
    .slice()
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  return {
    schemaVersion: registry?.schemaVersion ?? 1,
    topics: normalizedTopics,
  };
}

function validateTopicRegistry(registry, canonicalTags) {
  const errors = [];
  const warnings = [];

  if (!registry || typeof registry !== "object") {
    errors.push("Topic registry must be a JSON object.");
    return { errors, warnings };
  }

  if (registry.schemaVersion !== 1) {
    errors.push(`schemaVersion must be 1 (got ${JSON.stringify(registry.schemaVersion)})`);
  }

  if (!Array.isArray(registry.topics)) {
    errors.push("topics must be an array.");
    return { errors, warnings };
  }

  const seenIds = new Set();
  for (const topic of registry.topics) {
    if (!topic || typeof topic !== "object") {
      errors.push(`Invalid topic entry: ${JSON.stringify(topic)}`);
      continue;
    }

    const id = topic.id;
    const title = topic.title;
    const tags = topic.tags;

    if (typeof id !== "string" || !id.length) {
      errors.push("Topic id must be a non-empty string.");
    } else {
      if (!kebabCaseRegex.test(id)) errors.push(`Topic id must be kebab-case: ${id}`);
      if (seenIds.has(id)) errors.push(`Duplicate topic id: ${id}`);
      seenIds.add(id);
    }

    if (typeof title !== "string" || !title.trim().length) {
      errors.push(`Topic ${id || "<missing id>"} title must be non-empty.`);
    }

    if (!Array.isArray(tags)) {
      errors.push(`Topic ${id || "<missing id>"} tags must be an array.`);
      continue;
    }

    const tagSet = new Set();
    for (const tag of tags) {
      if (typeof tag !== "string" || !tag.length) {
        errors.push(`Topic ${id || "<missing id>"} has a non-string tag: ${JSON.stringify(tag)}`);
        continue;
      }
      if (!kebabCaseRegex.test(tag)) {
        errors.push(`Topic ${id || "<missing id>"} tag must be kebab-case: ${tag}`);
      }
      if (!canonicalTags.has(tag)) {
        errors.push(`Topic ${id || "<missing id>"} tag is not a canonical tag: ${tag}`);
      }
      if (tagSet.has(tag)) {
        errors.push(`Topic ${id || "<missing id>"} has duplicate tag: ${tag}`);
      }
      tagSet.add(tag);
    }

    if (tagSet.size > 0 && tagSet.size < 3) {
      warnings.push(`Topic ${id} has fewer than 3 tags (${tagSet.size}).`);
    }
  }

  return { errors, warnings };
}

if (HELP) {
  printUsage();
  process.exit(0);
}

const tagRegistryRaw = await fs.readFile(tagRegistryPath, "utf8");
const tagRegistry = JSON.parse(tagRegistryRaw);
const canonicalTags = new Set(Array.isArray(tagRegistry?.tags) ? tagRegistry.tags : []);

const originalText = await fs.readFile(topicRegistryPath, "utf8");
let registry;
try {
  registry = JSON.parse(originalText);
} catch (err) {
  console.error(`Invalid JSON in ${path.relative(projectRoot, topicRegistryPath)} (${err?.message ?? err})`);
  process.exit(1);
}

let outputRegistry = registry;
if (FIX) {
  outputRegistry = normalizeRegistryForFix(registry);
  const nextText = JSON.stringify(outputRegistry, null, 2) + "\n";
  if (nextText !== originalText) {
    await fs.writeFile(topicRegistryPath, nextText);
    console.log(`Auto-fixed ${path.relative(projectRoot, topicRegistryPath)}.`);
  }
}

const { errors, warnings } = validateTopicRegistry(outputRegistry, canonicalTags);
warnings.forEach((w) => console.warn(`Warning: ${w}`));

if (errors.length) {
  console.error(`Topic lint found ${errors.length} error(s).`);
  errors.forEach((e) => console.error(`- ${e}`));
  process.exit(1);
}

console.log("Topic lint passed.");

