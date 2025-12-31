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

const args = process.argv.slice(2);
const FIX = args.includes("--fix");
const JSON_OUTPUT = args.includes("--json");
const HELP = args.includes("--help") || args.includes("-h");

const kebabCaseRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const knownTechs = new Set(["javascript", "angular", "react", "vue", "html", "css"]);

const allowedTypes = new Set(["trivia", "coding", "system-design"]);
const allowedAccess = new Set(["free", "premium"]);
const allowedDifficulties = new Set(["easy", "intermediate", "hard"]);

const MAX_TAGS = 12;

function printUsage() {
  console.log(`lint-questions

Usage:
  node scripts/lint-questions.mjs            # report-only (CI)
  node scripts/lint-questions.mjs --fix      # sort + dedupe tags only
  node scripts/lint-questions.mjs --json     # machine-readable output

Validates question assets under:
  - ${path.relative(projectRoot, questionsRoot)}

Errors (fail CI):
  - invalid JSON / invalid top-level shape
  - missing/invalid question id
  - non-kebab-case ids
  - duplicate ids across all question assets
  - system-design index/meta mismatches

Warnings (do not fail CI):
  - legacy missing fields (type/access/tags)
  - difficulty: "medium" (not in app enum yet)
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

function arrayEquals(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function rel(p) {
  return path.relative(projectRoot, p);
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

function classifyQuestionAsset(file) {
  const relPath = path.relative(questionsRoot, file).split(path.sep).join("/");

  if (relPath === "system-design/index.json") {
    return { kind: "system-design-index" };
  }

  const techMatch = relPath.match(/^([a-z0-9-]+)\/(coding|trivia|debug)\.json$/);
  if (techMatch) {
    const tech = techMatch[1];
    const kind = techMatch[2];
    if (!knownTechs.has(tech)) return { kind: "unknown" };
    return { kind, tech };
  }

  const metaMatch = relPath.match(/^system-design\/([^/]+)\/meta\.json$/);
  if (metaMatch) {
    return { kind: "system-design-meta", slug: metaMatch[1] };
  }

  return { kind: "unknown" };
}

function buildTagLookup(registry) {
  const tags = Array.isArray(registry?.tags) ? registry.tags : null;
  if (!tags) {
    throw new Error(`Invalid tag registry: expected "tags" array in ${rel(tagRegistryPath)}`);
  }
  const canonicalTags = new Set();
  for (const tag of tags) {
    if (typeof tag !== "string" || !tag.length) continue;
    canonicalTags.add(tag);
  }
  return canonicalTags;
}

function formatIssue(i) {
  const id = i.id ?? "<unknown>";
  return `${rel(i.file)}: ${id}: ${i.message}`;
}

function makeSeverityBuckets() {
  return {
    errors: [],
    warnings: [],
    addError(file, id, message) { this.errors.push({ file, id, message }); },
    addWarning(file, id, message) { this.warnings.push({ file, id, message }); },
  };
}

function validateTags({ file, id, tags, canonicalTags, severity }) {
  if (tags === undefined) {
    severity.addWarning(file, id, "Missing tags (legacy question shape).");
    return { ok: false, fixable: false, tags: null };
  }

  if (!Array.isArray(tags)) {
    severity.addWarning(file, id, `Invalid tags (expected string[], got ${typeof tags}).`);
    return { ok: false, fixable: false, tags: null };
  }

  const tagList = [];
  const seen = new Set();
  let hasUnfixable = false;

  for (const t of tags) {
    if (typeof t !== "string" || !t.length) {
      severity.addError(file, id, `Tag is not a non-empty string: ${JSON.stringify(t)}`);
      hasUnfixable = true;
      continue;
    }
    if (!kebabCaseRegex.test(t)) {
      severity.addError(file, id, `Tag must be kebab-case: ${t}`);
      hasUnfixable = true;
    }
    if (!canonicalTags.has(t)) {
      severity.addError(file, id, `Unknown (non-canonical) tag: ${t}`);
      hasUnfixable = true;
    }
    if (seen.has(t)) {
      // fixable via dedupe
      severity.addWarning(file, id, `Duplicate tag: ${t}`);
    }
    seen.add(t);
    tagList.push(t);
  }

  if (tagList.length > MAX_TAGS) {
    severity.addError(file, id, `Too many tags (${tagList.length} > ${MAX_TAGS})`);
    hasUnfixable = true;
  }

  return { ok: !hasUnfixable, fixable: !hasUnfixable, tags: tagList };
}

function validateDifficulty({ file, id, difficulty, severity }) {
  if (difficulty === undefined) {
    severity.addWarning(file, id, "Missing difficulty (defaults to easy at runtime).");
    return;
  }
  if (typeof difficulty !== "string" || !difficulty.length) {
    severity.addError(file, id, `Invalid difficulty (expected string, got ${JSON.stringify(difficulty)})`);
    return;
  }
  if (allowedDifficulties.has(difficulty)) return;
  if (difficulty === "medium") {
    severity.addWarning(file, id, "Difficulty is \"medium\" (not in app enum; treat as intermediate later).");
    return;
  }
  severity.addError(file, id, `Unknown difficulty: ${difficulty}`);
}

function validateAccess({ file, id, access, severity, required }) {
  if (access === undefined) {
    if (required) severity.addError(file, id, "Missing access.");
    else severity.addWarning(file, id, "Missing access (defaults to free at runtime).");
    return;
  }
  if (typeof access !== "string" || !access.length) {
    severity.addError(file, id, `Invalid access (expected string, got ${JSON.stringify(access)})`);
    return;
  }
  if (!allowedAccess.has(access)) severity.addError(file, id, `Unknown access: ${access}`);
}

function validateType({ file, id, type, severity, expected, required }) {
  if (type === undefined) {
    if (required) severity.addError(file, id, "Missing type.");
    else severity.addWarning(file, id, "Missing type (defaults to kind at runtime).");
    return;
  }
  if (typeof type !== "string" || !type.length) {
    severity.addError(file, id, `Invalid type (expected string, got ${JSON.stringify(type)})`);
    return;
  }
  if (!allowedTypes.has(type)) {
    severity.addError(file, id, `Unknown type: ${type}`);
    return;
  }
  if (expected && type !== expected) {
    severity.addError(file, id, `Type mismatch (expected ${expected}, got ${type})`);
  }
}

function validateTechnology({ file, id, technology, severity, expectedTech, required }) {
  if (technology === undefined) {
    if (required) severity.addError(file, id, "Missing technology.");
    else severity.addWarning(file, id, "Missing technology (defaults to folder tech at runtime).");
    return;
  }
  if (typeof technology !== "string" || !technology.length) {
    severity.addError(file, id, `Invalid technology (expected string, got ${JSON.stringify(technology)})`);
    return;
  }
  if (!knownTechs.has(technology)) {
    severity.addError(file, id, `Unknown technology: ${technology}`);
    return;
  }
  if (expectedTech && technology !== expectedTech) {
    severity.addError(file, id, `Technology mismatch (expected ${expectedTech}, got ${technology})`);
  }
}

// ---------- minimal JSON token parsing helpers (for safe tag patches) ----------
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
    if (esc === "\"" || esc === "\\" || esc === "/") { value += esc; i += 2; continue; }
    if (esc === "b") { value += "\b"; i += 2; continue; }
    if (esc === "f") { value += "\f"; i += 2; continue; }
    if (esc === "n") { value += "\n"; i += 2; continue; }
    if (esc === "r") { value += "\r"; i += 2; continue; }
    if (esc === "t") { value += "\t"; i += 2; continue; }
    if (esc === "u") {
      const hex = text.slice(i + 2, i + 6);
      if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new Error(`Invalid unicode escape at ${i}`);
      value += String.fromCharCode(Number.parseInt(hex, 16));
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

if (HELP) {
  printUsage();
  process.exit(0);
}

let canonicalTags;
try {
  const registryRaw = await fs.readFile(tagRegistryPath, "utf8");
  canonicalTags = buildTagLookup(JSON.parse(registryRaw));
} catch (err) {
  console.error(`Failed to load ${rel(tagRegistryPath)} (${err?.message ?? err})`);
  process.exit(1);
}

const severity = makeSeverityBuckets();
const changedFiles = new Set();

// Track global uniqueness (question ids only — system-design meta is validated separately).
const idIndex = new Map(); // id -> { file, kind }

function registerId(file, id, kindLabel) {
  const prev = idIndex.get(id);
  if (prev) {
    severity.addError(
      file,
      id,
      `Duplicate id (also in ${rel(prev.file)} as ${prev.kind})`
    );
    return;
  }
  idIndex.set(id, { file, kind: kindLabel });
}

const systemDesignIndexById = new Map(); // id -> { file, entry }
const systemDesignMetaById = new Map();  // id -> { file, meta, slug }

const jsonFiles = await listJsonFiles(questionsRoot);
const questionFiles = jsonFiles
  .filter((file) => {
    const base = path.basename(file);
    if (base === "tag-registry.json") return false;
    if (base === "topic-registry.json") return false;
    if (base === "track-registry.json") return false;
    const info = classifyQuestionAsset(file);
    return info.kind !== "unknown";
  })
  .sort();

for (const file of questionFiles) {
  const info = classifyQuestionAsset(file);
  const raw = await fs.readFile(file, "utf8");

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    severity.addError(file, "<file>", `Invalid JSON (${err?.message ?? err})`);
    continue;
  }

  const tagPatches = new Map();

  if (info.kind === "coding" || info.kind === "trivia" || info.kind === "debug") {
    if (!Array.isArray(data)) {
      severity.addError(file, "<file>", "Top-level JSON must be an array.");
      continue;
    }

    for (let i = 0; i < data.length; i += 1) {
      const q = data[i];
      if (!q || typeof q !== "object" || Array.isArray(q)) {
        severity.addError(file, `<index ${i}>`, "Question entry must be an object.");
        continue;
      }

      const id = typeof q.id === "string" ? q.id : null;
      if (!id) {
        severity.addError(file, `<index ${i}>`, "Missing or invalid id.");
        continue;
      }
      if (!kebabCaseRegex.test(id)) {
        severity.addError(file, id, `id must be kebab-case: ${id}`);
      }
      registerId(file, id, `${info.tech}/${info.kind}`);

      const title = q.title;
      if (typeof title !== "string" || !title.trim()) {
        severity.addError(file, id, "Missing or invalid title.");
      }

      // debug questions are a different schema; treat type/technology/access as legacy optional.
      if (info.kind !== "debug") {
        validateType({ file, id, type: q.type, severity, expected: info.kind, required: false });
        validateTechnology({ file, id, technology: q.technology, severity, expectedTech: info.tech, required: false });
        validateAccess({ file, id, access: q.access, severity, required: false });
      }

      validateDifficulty({ file, id, difficulty: q.difficulty, severity });

      const tagCheck = validateTags({ file, id, tags: q.tags, canonicalTags, severity });

      const importance = q.importance;
      if (importance === undefined) {
        severity.addWarning(file, id, "Missing importance (defaults to 0 at runtime).");
      } else if (typeof importance !== "number" || !Number.isFinite(importance)) {
        severity.addWarning(file, id, `Invalid importance (expected number, got ${JSON.stringify(importance)})`);
      }

      if (FIX && tagCheck.fixable && Array.isArray(tagCheck.tags)) {
        const normalized = unique(tagCheck.tags).slice().sort();
        if (!arrayEquals(tagCheck.tags, normalized)) {
          tagPatches.set(id, normalized);
        }
      }
    }
  } else if (info.kind === "system-design-index") {
    if (!Array.isArray(data)) {
      severity.addError(file, "<file>", "Top-level JSON must be an array.");
      continue;
    }

    for (let i = 0; i < data.length; i += 1) {
      const entry = data[i];
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        severity.addError(file, `<index ${i}>`, "Entry must be an object.");
        continue;
      }

      const id = typeof entry.id === "string" ? entry.id : null;
      if (!id) {
        severity.addError(file, `<index ${i}>`, "Missing or invalid id.");
        continue;
      }
      if (!kebabCaseRegex.test(id)) {
        severity.addError(file, id, `id must be kebab-case: ${id}`);
      }

      // system-design ids participate in global uniqueness.
      registerId(file, id, "system-design");

      if (systemDesignIndexById.has(id)) {
        severity.addError(file, id, "Duplicate system-design index id.");
      } else {
        systemDesignIndexById.set(id, { file, entry });
      }

      const title = entry.title;
      if (typeof title !== "string" || !title.trim()) {
        severity.addError(file, id, "Missing or invalid title.");
      }

      const description = entry.description;
      if (typeof description !== "string" || !description.trim()) {
        severity.addError(file, id, "Missing or invalid description.");
      }

      validateType({ file, id, type: entry.type, severity, expected: "system-design", required: true });
      validateAccess({ file, id, access: entry.access, severity, required: true });

      const tagCheck = validateTags({ file, id, tags: entry.tags, canonicalTags, severity });
      if (FIX && tagCheck.fixable && Array.isArray(tagCheck.tags)) {
        const normalized = unique(tagCheck.tags).slice().sort();
        if (!arrayEquals(tagCheck.tags, normalized)) {
          tagPatches.set(id, normalized);
        }
      }
    }
  } else if (info.kind === "system-design-meta") {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      severity.addError(file, "<file>", "Top-level JSON must be an object.");
      continue;
    }

    const id = typeof data.id === "string" ? data.id : null;
    if (!id) {
      severity.addError(file, "<file>", "Missing or invalid id.");
      continue;
    }
    if (!kebabCaseRegex.test(id)) {
      severity.addError(file, id, `id must be kebab-case: ${id}`);
    }
    if (info.slug !== id) {
      severity.addError(file, id, `Folder slug mismatch (expected ${info.slug}, got ${id})`);
    }

    if (systemDesignMetaById.has(id)) {
      severity.addError(file, id, "Duplicate system-design meta id.");
    } else {
      systemDesignMetaById.set(id, { file, meta: data, slug: info.slug });
    }

    const title = data.title;
    if (typeof title !== "string" || !title.trim()) {
      severity.addWarning(file, id, "Missing or invalid title.");
    }
    const description = data.description;
    if (typeof description !== "string" || !description.trim()) {
      severity.addWarning(file, id, "Missing or invalid description.");
    }

    const tagCheck = validateTags({ file, id, tags: data.tags, canonicalTags, severity });
    if (FIX && tagCheck.fixable && Array.isArray(tagCheck.tags)) {
      const normalized = unique(tagCheck.tags).slice().sort();
      if (!arrayEquals(tagCheck.tags, normalized)) {
        tagPatches.set(id, normalized);
      }
    }
  }

  if (FIX && tagPatches.size) {
    const indent = detectIndent(raw);
    let output;
    try {
      output = applyTagPatchesToText(raw, tagPatches, indent);
    } catch (err) {
      severity.addError(file, "<file>", `Auto-fix failed: ${err?.message ?? err}`);
      continue;
    }

    if (output !== raw) {
      await fs.writeFile(file, output);
      changedFiles.add(rel(file));
    }
  }
}

// Cross-check system-design index <-> meta files
for (const [id, { file: indexFile }] of systemDesignIndexById) {
  const expectedMetaPath = path.join(questionsRoot, "system-design", id, "meta.json");
  const meta = systemDesignMetaById.get(id);
  if (!meta) {
    severity.addError(indexFile, id, `Missing system-design meta.json (${rel(expectedMetaPath)})`);
  } else if (path.resolve(meta.file) !== path.resolve(expectedMetaPath)) {
    severity.addError(indexFile, id, `Unexpected meta path: ${rel(meta.file)} (expected ${rel(expectedMetaPath)})`);
  }
}

for (const [id, meta] of systemDesignMetaById) {
  if (!systemDesignIndexById.has(id)) {
    severity.addError(meta.file, id, "system-design meta.json has no matching entry in system-design/index.json");
  }
}

const output = {
  ok: severity.errors.length === 0,
  errors: severity.errors.map((e) => ({ ...e, file: rel(e.file) })),
  warnings: severity.warnings.map((w) => ({ ...w, file: rel(w.file) })),
  changedFiles: [...changedFiles].sort(),
};

if (JSON_OUTPUT) {
  console.log(JSON.stringify(output, null, 2));
} else {
  const MAX_WARNINGS_PRINT = 50;
  const warnList = severity.warnings;
  for (const w of warnList.slice(0, MAX_WARNINGS_PRINT)) console.warn(`Warning: ${formatIssue(w)}`);
  if (warnList.length > MAX_WARNINGS_PRINT) {
    console.warn(`Warning: ...and ${warnList.length - MAX_WARNINGS_PRINT} more warning(s) (run with --json for full list)`);
  }

  if (severity.errors.length) {
    console.error(`Question lint found ${severity.errors.length} error(s).`);
    severity.errors.forEach((e) => console.error(`- ${formatIssue(e)}`));
  } else if (warnList.length) {
    console.log(`Question lint passed (${warnList.length} warning(s)).`);
  } else {
    console.log("Question lint passed.");
  }

  if (FIX && changedFiles.size) {
    console.log(`\nAuto-fixed ${changedFiles.size} file(s):`);
    for (const f of [...changedFiles].sort()) console.log(`- ${f}`);
  }
}

process.exit(severity.errors.length ? 1 : 0);
