#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// project root = one level up from /scripts
const projectRoot = path.resolve(__dirname, "..");
const questionsRoot = path.join(projectRoot, "src", "assets", "questions");
const registryPath = path.join(questionsRoot, "tag-registry.json");
const topicRegistryPath = path.join(questionsRoot, "topic-registry.json");

const args = process.argv.slice(2);
const FIX = args.includes("--fix");
const HELP = args.includes("--help") || args.includes("-h");

const kebabCaseRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function printUsage() {
  console.log(`lint-tags

Usage:
  node scripts/lint-tags.mjs            # report-only (CI)
  node scripts/lint-tags.mjs --fix      # auto-fix safe issues

Rules:
  - tags must be kebab-case
  - tags must be canonical (no aliases)
  - max 12 tags per question
  - no duplicates
  - tags must exist in tag-registry.json
`);
}

function toKebabCase(value) {
  let tag = String(value ?? "").trim();
  tag = tag.replace(/^[^A-Za-z0-9]+/, "");
  tag = tag.replace(/[^A-Za-z0-9]+$/, "");
  tag = tag.replace(/([a-z0-9])([A-Z])/g, "$1-$2");
  tag = tag.replace(/([A-Z])([A-Z][a-z])/g, "$1-$2");
  tag = tag.replace(/[\s_]+/g, "-");
  tag = tag.replace(/[^A-Za-z0-9-]+/g, "-");
  tag = tag.toLowerCase();
  tag = tag.replace(/-+/g, "-").replace(/^-|-$/g, "");
  return tag;
}

function detectIndent(text) {
  const lines = text.split("\n");
  let minSpaces = Infinity;
  for (const line of lines) {
    if (!line.trim()) continue;
    const match = line.match(/^(\s+)\S/);
    if (!match) continue;
    const indent = match[1];
    if (indent.includes("\t")) return "\t";
    const spaces = indent.length;
    if (spaces > 0 && spaces < minSpaces) minSpaces = spaces;
  }
  return Number.isFinite(minSpaces) ? minSpaces : 2;
}

function indentUnitString(indent) {
  if (indent === "\t") return "\t";
  const spaces = typeof indent === "number" ? indent : 2;
  return " ".repeat(spaces);
}

function isWhitespace(ch) {
  return ch === " " || ch === "\n" || ch === "\r" || ch === "\t";
}

function skipWhitespace(text, index) {
  let i = index;
  while (i < text.length && isWhitespace(text[i])) i += 1;
  return i;
}

function parseStringToken(text, startIndex) {
  if (text[startIndex] !== "\"") throw new Error(`Expected string at ${startIndex}`);
  let i = startIndex + 1;
  let value = "";
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\"") return { value, end: i + 1 };
    if (ch !== "\\") {
      value += ch;
      i += 1;
      continue;
    }

    const esc = text[i + 1];
    if (!esc) throw new Error(`Invalid escape at ${i}`);
    if (esc === "\"" || esc === "\\" || esc === "/") {
      value += esc;
      i += 2;
      continue;
    }
    if (esc === "b") { value += "\b"; i += 2; continue; }
    if (esc === "f") { value += "\f"; i += 2; continue; }
    if (esc === "n") { value += "\n"; i += 2; continue; }
    if (esc === "r") { value += "\r"; i += 2; continue; }
    if (esc === "t") { value += "\t"; i += 2; continue; }
    if (esc === "u") {
      const hex = text.slice(i + 2, i + 6);
      if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new Error(`Invalid unicode escape at ${i}`);
      const code = Number.parseInt(hex, 16);
      value += String.fromCharCode(code);
      i += 6;
      continue;
    }

    throw new Error(`Unknown escape \\${esc} at ${i}`);
  }
  throw new Error(`Unterminated string starting at ${startIndex}`);
}

function parseLiteral(text, startIndex) {
  let i = startIndex;
  while (i < text.length && !isWhitespace(text[i]) && text[i] !== "," && text[i] !== "]" && text[i] !== "}") i += 1;
  if (i === startIndex) throw new Error(`Expected literal at ${startIndex}`);
  return i;
}

function parseValue(text, startIndex, results) {
  let i = skipWhitespace(text, startIndex);
  const ch = text[i];
  if (ch === "{") return parseObject(text, i, results);
  if (ch === "[") return parseArray(text, i, results);
  if (ch === "\"") return parseStringToken(text, i).end;
  return parseLiteral(text, i);
}

function parseArray(text, startIndex, results) {
  if (text[startIndex] !== "[") throw new Error(`Expected array at ${startIndex}`);
  let i = skipWhitespace(text, startIndex + 1);
  if (text[i] === "]") return i + 1;
  while (i < text.length) {
    i = parseValue(text, i, results);
    i = skipWhitespace(text, i);
    if (text[i] === ",") {
      i = skipWhitespace(text, i + 1);
      continue;
    }
    if (text[i] === "]") return i + 1;
    throw new Error(`Expected , or ] at ${i}`);
  }
  throw new Error(`Unterminated array starting at ${startIndex}`);
}

function parseObject(text, startIndex, results) {
  if (text[startIndex] !== "{") throw new Error(`Expected object at ${startIndex}`);
  let i = skipWhitespace(text, startIndex + 1);

  let objectId = null;
  let tagsInfo = null;

  if (text[i] === "}") return i + 1;
  while (i < text.length) {
    i = skipWhitespace(text, i);
    const keyStart = i;
    const { value: key, end: keyEnd } = parseStringToken(text, i);
    i = skipWhitespace(text, keyEnd);
    if (text[i] !== ":") throw new Error(`Expected : after key at ${i}`);
    i = skipWhitespace(text, i + 1);

    if (key === "id" && text[i] === "\"") {
      const { value: idValue, end: idEnd } = parseStringToken(text, i);
      objectId = idValue;
      i = idEnd;
    } else if (key === "tags" && text[i] === "[") {
      const valueStart = i;
      const valueEnd = parseArray(text, i, results);
      tagsInfo = { keyStart, valueStart, valueEnd };
      i = valueEnd;
    } else {
      i = parseValue(text, i, results);
    }

    i = skipWhitespace(text, i);
    if (text[i] === ",") {
      i = skipWhitespace(text, i + 1);
      continue;
    }
    if (text[i] === "}") break;
    throw new Error(`Expected , or } at ${i}`);
  }

  if (text[i] !== "}") throw new Error(`Unterminated object starting at ${startIndex}`);
  i += 1;
  if (objectId && tagsInfo) results.push({ id: objectId, ...tagsInfo });
  return i;
}

function extractTagLocations(text) {
  const results = [];
  const start = skipWhitespace(text, 0);
  const end = parseValue(text, start, results);
  const finalIndex = skipWhitespace(text, end);
  if (finalIndex !== text.length) throw new Error(`Unexpected trailing content at ${finalIndex}`);

  const byId = new Map();
  for (const entry of results) {
    const existing = byId.get(entry.id);
    if (existing) {
      throw new Error(`Duplicate id while scanning tag locations: ${entry.id}`);
    }
    byId.set(entry.id, entry);
  }
  return byId;
}

function formatTagsArray(tags, { propertyIndent, indentUnit }) {
  if (!tags.length) return "[]";
  const itemIndent = propertyIndent + indentUnit;
  const lines = ["["];
  tags.forEach((tag, index) => {
    const comma = index === tags.length - 1 ? "" : ",";
    lines.push(`${itemIndent}${JSON.stringify(tag)}${comma}`);
  });
  lines.push(`${propertyIndent}]`);
  return lines.join("\n");
}

function applyTagPatchesToText(originalText, tagPatches, indent) {
  const indentUnit = indentUnitString(indent);
  const locationsById = extractTagLocations(originalText);

  const replacements = [];
  for (const [id, nextTags] of tagPatches.entries()) {
    const loc = locationsById.get(id);
    if (!loc) throw new Error(`Could not find tag location for id: ${id}`);

    const lineStart = originalText.lastIndexOf("\n", loc.keyStart - 1) + 1;
    const propertyIndent = originalText.slice(lineStart, loc.keyStart);
    const nextArrayText = formatTagsArray(nextTags, { propertyIndent, indentUnit });
    replacements.push({ start: loc.valueStart, end: loc.valueEnd, text: nextArrayText });
  }

  replacements.sort((a, b) => b.start - a.start);
  let text = originalText;
  for (const r of replacements) {
    text = text.slice(0, r.start) + r.text + text.slice(r.end);
  }
  return text;
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

function* iterTaggableObjects(node) {
  if (Array.isArray(node)) {
    for (const item of node) yield* iterTaggableObjects(item);
    return;
  }
  if (!node || typeof node !== "object") return;

  if (typeof node.id === "string" && Array.isArray(node.tags)) {
    yield node;
  }
  for (const value of Object.values(node)) {
    yield* iterTaggableObjects(value);
  }
}

function arrayEquals(a, b) {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return false;
  }
  return true;
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

function buildRegistryLookups(registry) {
  const errors = [];

  const tags = Array.isArray(registry?.tags) ? registry.tags : null;
  if (!tags) errors.push(`Invalid tag registry: expected \"tags\" array in ${registryPath}`);

  const canonicalTags = new Set();
  const duplicates = new Set();
  for (const tag of tags ?? []) {
    if (typeof tag !== "string") {
      errors.push(`Invalid tag in registry: ${JSON.stringify(tag)}`);
      continue;
    }
    if (!kebabCaseRegex.test(tag)) {
      errors.push(`Registry tag is not kebab-case: ${tag}`);
    }
    if (canonicalTags.has(tag)) duplicates.add(tag);
    canonicalTags.add(tag);
  }
  if (duplicates.size) {
    errors.push(`Duplicate canonical tags in registry: ${[...duplicates].sort().join(", ")}`);
  }

  const aliasEntries = registry?.aliases && typeof registry.aliases === "object" ? registry.aliases : {};

  const aliasToCanonical = new Map();
  for (const [alias, canonical] of Object.entries(aliasEntries)) {
    if (typeof canonical !== "string") {
      errors.push(`Invalid alias mapping for ${alias}: ${JSON.stringify(canonical)}`);
      continue;
    }
    if (!canonicalTags.has(canonical)) {
      errors.push(`Alias maps to unknown canonical tag: ${alias} -> ${canonical}`);
      continue;
    }
    const existing = aliasToCanonical.get(alias);
    if (existing && existing !== canonical) {
      errors.push(`Alias collision: ${alias} maps to both ${existing} and ${canonical}`);
      continue;
    }
    aliasToCanonical.set(alias, canonical);

    const normalized = toKebabCase(alias);
    const existingNormalized = aliasToCanonical.get(normalized);
    if (existingNormalized && existingNormalized !== canonical) {
      errors.push(`Alias collision after normalization: ${alias} (${normalized}) maps to both ${existingNormalized} and ${canonical}`);
      continue;
    }
    aliasToCanonical.set(normalized, canonical);
  }

  return { errors, canonicalTags, aliasToCanonical };
}

function resolveCanonicalTag(tag, { canonicalTags, aliasToCanonical }) {
  if (canonicalTags.has(tag)) return tag;
  const direct = aliasToCanonical.get(tag);
  if (direct) return direct;

  const normalized = toKebabCase(tag);
  if (canonicalTags.has(normalized)) return normalized;
  return aliasToCanonical.get(normalized) ?? null;
}

function formatIssue({ file, id, message }) {
  return `${path.relative(projectRoot, file)}: ${id}: ${message}`;
}

if (HELP) {
  printUsage();
  process.exit(0);
}

const registryRaw = await fs.readFile(registryPath, "utf8");
const registry = JSON.parse(registryRaw);
const { errors: registryErrors, canonicalTags, aliasToCanonical } = buildRegistryLookups(registry);
if (registryErrors.length) {
  console.error("Tag registry errors:");
  for (const err of registryErrors) console.error(`- ${err}`);
  process.exit(1);
}

const jsonFiles = (await listJsonFiles(questionsRoot)).filter(
  (file) =>
    path.resolve(file) !== path.resolve(registryPath) &&
    path.resolve(file) !== path.resolve(topicRegistryPath),
);

const issues = [];
const unresolvedIssues = [];
const changedFiles = new Set();

for (const file of jsonFiles.sort()) {
  const originalText = await fs.readFile(file, "utf8");
  let data;
  try {
    data = JSON.parse(originalText);
  } catch (err) {
    const issue = { file, id: "<file>", message: `Invalid JSON (${err?.message ?? err})` };
    issues.push(issue);
    unresolvedIssues.push(issue);
    continue;
  }

  const tagPatches = new Map();
  for (const obj of iterTaggableObjects(data)) {
    const id = obj.id;
    const tags = obj.tags;
    if (!Array.isArray(tags)) continue;

    const originalTags = tags.slice();

    const normalized = [];
    let anyFixableChange = false;
    let hasUnresolved = false;

    for (const rawTag of originalTags) {
      if (typeof rawTag !== "string") {
        const issue = { file, id, message: `Tag is not a string: ${JSON.stringify(rawTag)}` };
        issues.push(issue);
        unresolvedIssues.push(issue);
        hasUnresolved = true;
        normalized.push(rawTag);
        continue;
      }

      const canonical = resolveCanonicalTag(rawTag, { canonicalTags, aliasToCanonical });
      if (!canonical) {
        const issue = { file, id, message: `Unknown tag: ${rawTag}` };
        issues.push(issue);
        unresolvedIssues.push(issue);
        hasUnresolved = true;
        normalized.push(rawTag);
        continue;
      }

      if (!kebabCaseRegex.test(rawTag)) {
        const issue = { file, id, message: `Tag must be kebab-case: ${rawTag} (→ ${canonical})` };
        issues.push(issue);
        anyFixableChange = true;
      } else if (rawTag !== canonical) {
        const issue = { file, id, message: `Alias tag used: ${rawTag} (→ ${canonical})` };
        issues.push(issue);
        anyFixableChange = true;
      }

      normalized.push(canonical);
      if (rawTag !== canonical) anyFixableChange = true;
    }

    const deduped = unique(normalized);
    const hasDuplicates = deduped.length !== normalized.length;
    if (hasDuplicates) {
      const issue = { file, id, message: "Duplicate tags" };
      issues.push(issue);
      anyFixableChange = true;
    }

    if (deduped.length > 12) {
      const issue = { file, id, message: `Too many tags (${deduped.length} > 12)` };
      issues.push(issue);
      unresolvedIssues.push(issue);
      hasUnresolved = true;
    }

    if (FIX && anyFixableChange && !hasUnresolved) {
      const nextTags = deduped.slice().sort();
      if (!arrayEquals(originalTags, nextTags)) {
        tagPatches.set(id, nextTags);
      }
    }
  }

  if (FIX && tagPatches.size) {
    const indent = detectIndent(originalText);
    let output;
    try {
      output = applyTagPatchesToText(originalText, tagPatches, indent);
    } catch (err) {
      const message = err?.message ? String(err.message) : String(err);
      const issue = { file, id: "<file>", message: `Auto-fix failed: ${message}` };
      issues.push(issue);
      unresolvedIssues.push(issue);
      continue;
    }
    if (output !== originalText) {
      await fs.writeFile(file, output);
      changedFiles.add(path.relative(projectRoot, file));
    }
  }
}

const reportIssues = FIX ? unresolvedIssues : issues;
if (reportIssues.length) {
  const issueLines = reportIssues.map(formatIssue);
  console.error(`Tag lint found ${reportIssues.length} issue(s).`);
  for (const line of issueLines) console.error(`- ${line}`);
} else {
  console.log("Tag lint passed.");
}

if (FIX && changedFiles.size) {
  console.log(`\nAuto-fixed ${changedFiles.size} file(s):`);
  for (const f of [...changedFiles].sort()) console.log(`- ${f}`);
}

process.exit(reportIssues.length ? 1 : 0);
