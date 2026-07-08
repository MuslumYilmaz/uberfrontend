#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import {
  cdnQuestionsDir as questionsRoot,
  frontendRoot as projectRoot,
} from "./content-paths.mjs";

const tagRegistryPath = path.join(questionsRoot, "tag-registry.json");
const topicRegistryPath = path.join(questionsRoot, "topic-registry.json");
const cssCodingPath = path.join(questionsRoot, "css", "coding.json");

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

function cssBlock(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(css || "").match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, "m"));
  return match?.[1] || "";
}

async function assertThemeVariablesChallenge(errors) {
  const cssCoding = JSON.parse(await fs.readFile(cssCodingPath, "utf8"));
  const challenge = Array.isArray(cssCoding)
    ? cssCoding.find((item) => item?.id === "css-theme-variables-dark-mode")
    : null;

  if (!challenge) {
    errors.push("css/coding.json: css-theme-variables-dark-mode: Missing challenge");
    return;
  }

  const starterCss = String(challenge?.web?.starterCss || "");
  const starterHtml = String(challenge?.web?.starterHtml || "");
  const solutionCss = String(challenge?.webSolutionCss || "");
  const solutionHtml = String(challenge?.webSolutionHtml || "");
  const approachCss = String(challenge?.solutionBlock?.approaches?.[0]?.codeCss || "");
  const literalColorPattern = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|\b(?:black|white|red|blue|green|transparent|currentcolor)\b/i;

  [
    ["starter .panel", cssBlock(starterCss, ".panel")],
    ["starter .btn", cssBlock(starterCss, ".btn")],
    ["solution .panel", cssBlock(solutionCss, ".panel")],
    ["solution .btn", cssBlock(solutionCss, ".btn")],
    ["approach .panel", cssBlock(approachCss, ".panel")],
    ["approach .btn", cssBlock(approachCss, ".btn")],
  ].forEach(([label, block]) => {
    if (!block) {
      errors.push(`css/coding.json: css-theme-variables-dark-mode: Missing ${label} block`);
      return;
    }
    if (literalColorPattern.test(block)) {
      errors.push(`css/coding.json: css-theme-variables-dark-mode: ${label} uses a literal color in a constrained component`);
    }
  });

  if (!starterCss.includes("box-shadow: var(--panel-shadow)")) {
    errors.push("css/coding.json: css-theme-variables-dark-mode: starter .panel must use box-shadow: var(--panel-shadow)");
  }
  if (!/<html\s+lang=["']en["']/i.test(starterHtml)) {
    errors.push("css/coding.json: css-theme-variables-dark-mode: starter HTML must expose an editable <html> root for manual override testing");
  }
  if (!/<html[^>]*class=["']theme-dark["']/i.test(solutionHtml)) {
    errors.push("css/coding.json: css-theme-variables-dark-mode: solution preview HTML must demonstrate the html.theme-dark override");
  }
  if (/>Action</i.test(`${starterHtml}\n${solutionHtml}`)) {
    errors.push("css/coding.json: css-theme-variables-dark-mode: sample button label should not imply a functional click action");
  }
  if (!solutionCss.includes("--panel-shadow: 0 1px 2px rgb(0 0 0 / 0.4)")) {
    errors.push("css/coding.json: css-theme-variables-dark-mode: solution CSS must define the dark --panel-shadow token");
  }
  if (challenge?.access !== "free") {
    errors.push("css/coding.json: css-theme-variables-dark-mode: challenge must remain free");
  }
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

await assertThemeVariablesChallenge(errors);

if (errors.length) {
  report("Question tag checks failed", errors);
  process.exit(1);
}

console.log("Question tag checks passed.");
