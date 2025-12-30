#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// project root = one level up from /scripts
const projectRoot = path.resolve(__dirname, "..");
const questionsRoot = path.join(projectRoot, "src", "assets", "questions");
const trackRegistryPath = path.join(questionsRoot, "track-registry.json");
const systemDesignRoot = path.join(questionsRoot, "system-design");
const systemDesignIndexPath = path.join(systemDesignRoot, "index.json");
const trackRegistryRel = path.relative(projectRoot, trackRegistryPath);

const args = process.argv.slice(2);
const HELP = args.includes("--help") || args.includes("-h");

function printUsage() {
  console.log(`lint-tracks

Usage:
  node scripts/lint-tracks.mjs

Validates that every question id referenced by tracks exists in assets/questions.
Tracks are read from:
  - ${path.relative(projectRoot, trackRegistryPath)}

Rules:
  - track ids (slugs) must be kebab-case
  - featured refs must have id/kind (and tech for coding/trivia)
  - coding/trivia: must exist in assets/questions/<tech>/<kind>.json
  - system-design: must exist in assets/questions/system-design/index.json AND <id>/meta.json
`);
}

const kebabCaseRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function formatLoc(pointer) {
  return pointer ? `${trackRegistryRel}#${pointer}` : trackRegistryRel;
}

async function loadTrackRefs() {
  const refs = [];
  const issues = [];

  let registry;
  try {
    registry = JSON.parse(await fs.readFile(trackRegistryPath, "utf8"));
  } catch (err) {
    issues.push({
      loc: formatLoc(""),
      track: "<registry>",
      message: `Invalid JSON (${err?.message ?? err})`,
    });
    return { refs, issues };
  }

  const schemaVersion = registry?.schemaVersion;
  if (schemaVersion !== 1) {
    issues.push({
      loc: formatLoc("/schemaVersion"),
      track: "<registry>",
      message: `Unsupported schemaVersion: ${JSON.stringify(schemaVersion)} (expected 1)`,
    });
  }

  const tracks = Array.isArray(registry?.tracks) ? registry.tracks : null;
  if (!tracks) {
    issues.push({
      loc: formatLoc("/tracks"),
      track: "<registry>",
      message: "Missing or invalid \"tracks\" array",
    });
    return { refs, issues };
  }

  const slugSeen = new Set();

  for (let trackIndex = 0; trackIndex < tracks.length; trackIndex += 1) {
    const track = tracks[trackIndex];
    const trackPtr = `/tracks[${trackIndex}]`;

    const slug = typeof track?.slug === "string" ? track.slug : null;
    const trackLabel = slug ?? `<tracks[${trackIndex}]>`;

    if (!slug) {
      issues.push({
        loc: formatLoc(`${trackPtr}/slug`),
        track: trackLabel,
        message: "Missing or invalid track.slug",
      });
    } else {
      if (!kebabCaseRegex.test(slug)) {
        issues.push({
          loc: formatLoc(`${trackPtr}/slug`),
          track: slug,
          message: `Track slug must be kebab-case: ${slug}`,
        });
      }
      if (slugSeen.has(slug)) {
        issues.push({
          loc: formatLoc(`${trackPtr}/slug`),
          track: slug,
          message: `Duplicate track slug: ${slug}`,
        });
      }
      slugSeen.add(slug);
    }

    const title = track?.title;
    if (typeof title !== "string" || !title.trim()) {
      issues.push({
        loc: formatLoc(`${trackPtr}/title`),
        track: trackLabel,
        message: "Missing or invalid track.title",
      });
    }

    const subtitle = track?.subtitle;
    if (typeof subtitle !== "string" || !subtitle.trim()) {
      issues.push({
        loc: formatLoc(`${trackPtr}/subtitle`),
        track: trackLabel,
        message: "Missing or invalid track.subtitle",
      });
    }

    const durationLabel = track?.durationLabel;
    if (typeof durationLabel !== "string" || !durationLabel.trim()) {
      issues.push({
        loc: formatLoc(`${trackPtr}/durationLabel`),
        track: trackLabel,
        message: "Missing or invalid track.durationLabel",
      });
    }

    const focus = track?.focus;
    if (!Array.isArray(focus) || focus.some((f) => typeof f !== "string")) {
      issues.push({
        loc: formatLoc(`${trackPtr}/focus`),
        track: trackLabel,
        message: "Missing or invalid track.focus (expected string[])",
      });
    }

    const hidden = track?.hidden;
    if (hidden !== undefined && typeof hidden !== "boolean") {
      issues.push({
        loc: formatLoc(`${trackPtr}/hidden`),
        track: trackLabel,
        message: "Invalid track.hidden (expected boolean)",
      });
    }

    const browseParams = track?.browseParams;
    if (!browseParams || typeof browseParams !== "object" || Array.isArray(browseParams)) {
      issues.push({
        loc: formatLoc(`${trackPtr}/browseParams`),
        track: trackLabel,
        message: "Missing or invalid track.browseParams (expected object)",
      });
    } else {
      for (const [k, v] of Object.entries(browseParams)) {
        if (typeof k !== "string" || !k) {
          issues.push({
            loc: formatLoc(`${trackPtr}/browseParams`),
            track: trackLabel,
            message: "Invalid browseParams key",
          });
          break;
        }
        if (v !== null && typeof v !== "string") {
          issues.push({
            loc: formatLoc(`${trackPtr}/browseParams/${k}`),
            track: trackLabel,
            message: `Invalid browseParams value for "${k}" (expected string|null)`,
          });
        }
      }
    }

    const featured = track?.featured;
    if (!Array.isArray(featured)) {
      issues.push({
        loc: formatLoc(`${trackPtr}/featured`),
        track: trackLabel,
        message: "Missing or invalid track.featured (expected array)",
      });
      continue;
    }

    for (let refIndex = 0; refIndex < featured.length; refIndex += 1) {
      const ref = featured[refIndex];
      const refPtr = `${trackPtr}/featured[${refIndex}]`;

      const id = typeof ref?.id === "string" ? ref.id : null;
      const kind = typeof ref?.kind === "string" ? ref.kind : null;
      const tech = typeof ref?.tech === "string" ? ref.tech : null;

      if (!id || !kind) {
        issues.push({
          loc: formatLoc(refPtr),
          track: trackLabel,
          message: `Invalid featured ref (missing ${!id ? "id" : "kind"})`,
        });
        continue;
      }

      if (kind !== "coding" && kind !== "trivia" && kind !== "system-design") {
        issues.push({
          loc: formatLoc(`${refPtr}/kind`),
          track: trackLabel,
          message: `Unknown ref.kind "${kind}" for id "${id}"`,
        });
      }

      if ((kind === "coding" || kind === "trivia") && !tech) {
        issues.push({
          loc: formatLoc(refPtr),
          track: trackLabel,
          message: `Missing tech for ${kind} question id "${id}"`,
        });
        continue;
      }

      refs.push({
        track: slug ?? trackLabel,
        id,
        kind,
        tech,
        loc: formatLoc(refPtr),
      });
    }
  }

  return { refs, issues };
}

async function buildQuestionIndex() {
  const questionKeyToFile = new Map();
  const questionIdToKeys = new Map();

  const entries = await fs.readdir(questionsRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "system-design") continue;
    const tech = entry.name;
    const techDir = path.join(questionsRoot, tech);
    const files = await fs.readdir(techDir, { withFileTypes: true });
    for (const file of files) {
      if (!file.isFile()) continue;
      if (!file.name.endsWith(".json")) continue;
      const kind = file.name.replace(/\.json$/, "");
      if (kind !== "coding" && kind !== "trivia") continue;

      const filePath = path.join(techDir, file.name);
      const raw = await fs.readFile(filePath, "utf8");
      let data;
      try {
        data = JSON.parse(raw);
      } catch (err) {
        throw new Error(`Invalid JSON: ${path.relative(projectRoot, filePath)} (${err?.message ?? err})`);
      }
      if (!Array.isArray(data)) continue;

      for (const item of data) {
        if (!item || typeof item !== "object") continue;
        const id = item.id;
        if (typeof id !== "string" || !id.trim()) continue;

        const key = `${kind}::${tech}::${id}`;
        const existing = questionKeyToFile.get(key);
        if (existing && existing !== filePath) {
          throw new Error(
            `Duplicate question id for ${key} in ${path.relative(projectRoot, existing)} and ${path.relative(projectRoot, filePath)}`
          );
        }
        questionKeyToFile.set(key, filePath);

        const keys = questionIdToKeys.get(id) ?? [];
        keys.push({ kind, tech, file: filePath });
        questionIdToKeys.set(id, keys);
      }
    }
  }

  return { questionKeyToFile, questionIdToKeys };
}

async function buildSystemDesignIndex() {
  let indexData;
  try {
    indexData = JSON.parse(await fs.readFile(systemDesignIndexPath, "utf8"));
  } catch (err) {
    throw new Error(`Invalid JSON: ${path.relative(projectRoot, systemDesignIndexPath)} (${err?.message ?? err})`);
  }

  const indexIds = new Set();
  if (Array.isArray(indexData)) {
    for (const item of indexData) {
      if (!item || typeof item !== "object") continue;
      if (typeof item.id !== "string") continue;
      indexIds.add(item.id);
    }
  }

  const metaIds = new Set();
  const dirEntries = await fs.readdir(systemDesignRoot, { withFileTypes: true });
  for (const entry of dirEntries) {
    if (!entry.isDirectory()) continue;
    const metaPath = path.join(systemDesignRoot, entry.name, "meta.json");
    try {
      const meta = JSON.parse(await fs.readFile(metaPath, "utf8"));
      if (meta && typeof meta === "object" && typeof meta.id === "string") {
        metaIds.add(meta.id);
      }
    } catch {
      // ignore missing/invalid meta; we only validate for referenced ids
      continue;
    }
  }

  return { indexIds, metaIds };
}

function formatIssue(issue) {
  return `${issue.loc}: ${issue.track}: ${issue.message}`;
}

if (HELP) {
  printUsage();
  process.exit(0);
}

const { refs, issues: parseIssues } = await loadTrackRefs();
const { questionKeyToFile, questionIdToKeys } = await buildQuestionIndex();
const { indexIds: systemDesignIndexIds, metaIds: systemDesignMetaIds } = await buildSystemDesignIndex();

const issues = [...parseIssues];

for (const ref of refs) {
  if (ref.kind === "system-design") {
    const inIndex = systemDesignIndexIds.has(ref.id);
    const inMeta = systemDesignMetaIds.has(ref.id);
    if (inIndex && inMeta) continue;

    const missing = [];
    if (!inIndex) missing.push("system-design/index.json");
    if (!inMeta) missing.push("system-design/<id>/meta.json");
    issues.push({
      loc: ref.loc,
      track: ref.track,
      message: `Missing system-design question id "${ref.id}" (${missing.join(" + ")})`,
    });
    continue;
  }

  if (ref.kind !== "coding" && ref.kind !== "trivia") {
    issues.push({
      loc: ref.loc,
      track: ref.track,
      message: `Unknown question kind "${ref.kind}" for id "${ref.id}"`,
    });
    continue;
  }

  if (!ref.tech) {
    issues.push({
      loc: ref.loc,
      track: ref.track,
      message: `Missing tech for ${ref.kind} question id "${ref.id}"`,
    });
    continue;
  }

  const key = `${ref.kind}::${ref.tech}::${ref.id}`;
  if (questionKeyToFile.has(key)) continue;

  const matches = questionIdToKeys.get(ref.id) ?? [];
  if (matches.length) {
    const found = matches
      .map((m) => `${m.kind}/${m.tech} (${path.relative(projectRoot, m.file)})`)
      .sort()
      .join(", ");
    issues.push({
      loc: ref.loc,
      track: ref.track,
      message: `Question id "${ref.id}" not found for ${ref.kind}/${ref.tech}; found in: ${found}`,
    });
  } else {
    issues.push({
      loc: ref.loc,
      track: ref.track,
      message: `Question id "${ref.id}" not found in assets for ${ref.kind}/${ref.tech}`,
    });
  }
}

if (issues.length) {
  console.error(`Track lint found ${issues.length} issue(s).`);
  for (const line of issues.map(formatIssue)) console.error(`- ${line}`);
  process.exit(1);
}

console.log("Track lint passed.");
