#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const questionsRoot = path.join(projectRoot, "src", "assets", "questions");
const tagRegistryPath = path.join(questionsRoot, "tag-registry.json");
const topicRegistryPath = path.join(questionsRoot, "topic-registry.json");

const LEGACY_TRIVIA_NO_TAGS = new Set([
  "angular/trivia.json",
  "react/trivia.json",
  "vue/trivia.json",
  "css/trivia.json",
  "html/trivia.json",
]);

const QUESTION_FILE_PATTERNS = [
  /\/(coding|trivia|debug)\.json$/,
  /\/system-design\/index\.json$/,
  /\/system-design\/[^/]+\/meta\.json$/,
];

function toPosixPath(p) {
  return p.split(path.sep).join("/");
}

function isQuestionFile(relPath) {
  return QUESTION_FILE_PATTERNS.some((re) => re.test(relPath));
}

function requiresTags(relPath) {
  if (!isQuestionFile(relPath)) return false;
  if (/\/trivia\.json$/.test(relPath) && LEGACY_TRIVIA_NO_TAGS.has(relPath)) return false;
  return true;
}

function formatLabel(item) {
  if (item && typeof item === "object") {
    return item.id || item.title || "unknown";
  }
  return "unknown";
}

async function listJsonFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listJsonFiles(fullPath)));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".json")) continue;
    files.push(fullPath);
  }
  return files;
}

function buildAllowedTags(tagRegistry, topicRegistry) {
  const tags = Array.isArray(tagRegistry?.tags) ? tagRegistry.tags : [];
  const topicTags = Array.isArray(topicRegistry?.topics)
    ? topicRegistry.topics.flatMap((t) => Array.isArray(t?.tags) ? t.tags : [])
    : [];
  return new Set([...tags, ...topicTags].map((t) => String(t)));
}

function report(title, rows) {
  console.error(`${title} (${rows.length})`);
  for (const row of rows) console.error(`- ${row}`);
}

const tagRegistry = JSON.parse(await fs.readFile(tagRegistryPath, "utf8"));
const topicRegistry = JSON.parse(await fs.readFile(topicRegistryPath, "utf8"));
const allowedTags = buildAllowedTags(tagRegistry, topicRegistry);

const files = (await listJsonFiles(questionsRoot))
  .filter((file) => file !== tagRegistryPath && file !== topicRegistryPath)
  .map((file) => ({
    file,
    rel: toPosixPath(path.relative(questionsRoot, file)),
  }))
  .filter(({ rel }) => isQuestionFile(rel));

const errors = [];

for (const { file, rel } of files) {
  const raw = await fs.readFile(file, "utf8");
  const data = JSON.parse(raw);
  const items = Array.isArray(data)
    ? data
    : (data && typeof data === "object" ? [data] : []);

  for (const item of items) {
    const label = formatLabel(item);
    const hasTags = item && typeof item === "object" && Object.prototype.hasOwnProperty.call(item, "tags");
    const mustHaveTags = requiresTags(rel);

    if (mustHaveTags && !hasTags) {
      errors.push(`${rel}: ${label}: Missing tags`);
      continue;
    }

    if (!hasTags) continue;

    const tags = item.tags;
    if (!Array.isArray(tags)) {
      errors.push(`${rel}: ${label}: Tags must be an array`);
      continue;
    }

    if (mustHaveTags && tags.length === 0) {
      errors.push(`${rel}: ${label}: Tags array is empty`);
      continue;
    }

    for (const tag of tags) {
      if (typeof tag !== "string" || tag.trim().length === 0) {
        errors.push(`${rel}: ${label}: Invalid tag value ${JSON.stringify(tag)}`);
        continue;
      }
      if (!allowedTags.has(tag)) {
        errors.push(`${rel}: ${label}: Unknown tag ${tag}`);
      }
    }
  }
}

if (errors.length) {
  report("Question tag checks failed", errors);
  process.exit(1);
}

console.log("Question tag checks passed.");
