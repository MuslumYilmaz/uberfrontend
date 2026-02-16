#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const questionsRoot = path.join(projectRoot, "src", "assets", "questions");

const args = process.argv.slice(2);

function usage() {
  console.log(`score-importance-rubric

Usage:
  node scripts/score-importance-rubric.mjs [options]

Options:
  --tech <list>                 Tech scope (comma-separated, default: javascript,react)
  --kind <list>                 Kind scope (comma-separated, default: coding,trivia)
  --report <path>               Output report JSON
  --no-report                   Run scoring/apply without writing a report file
  --max-promotion-step <n>      Max importance increase per run (default: 2)
  --max-demotion-step <n>       Max importance decrease per run (default: 1)
  --ignore-manual-rubric        Ignore existing importanceRubric values while computing
  --seed-rubric-defaults        Persist rubric factors to question JSON files
  --overwrite-rubric-defaults   Overwrite existing rubric factors when seeding
  --apply                       Write proposed importance to question JSON files
  --help                        Show this help

Rubric formula:
  importance_raw = 1 + coreness + pass_critical + cross_company + frequency_bonus - detail_penalty
  importance = clamp(1..5)

Note:
  frequency_bonus is intentionally defaulted to 0 in this mode.
`);
}

function hasFlag(flag) {
  return args.includes(flag);
}

function getArg(flag, fallback = null) {
  const idx = args.indexOf(flag);
  if (idx === -1) return fallback;
  const value = args[idx + 1];
  if (!value || value.startsWith("--")) return fallback;
  return value;
}

if (hasFlag("--help") || hasFlag("-h")) {
  usage();
  process.exit(0);
}

const knownTechs = new Set(["javascript", "react", "angular", "vue", "html", "css"]);
const knownKinds = new Set(["coding", "trivia"]);

const requestedTechs = String(getArg("--tech", "javascript,react") || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const requestedKinds = String(getArg("--kind", "coding,trivia") || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

if (requestedTechs.length === 0) {
  console.error("--tech cannot be empty");
  process.exit(1);
}
if (requestedKinds.length === 0) {
  console.error("--kind cannot be empty");
  process.exit(1);
}

for (const tech of requestedTechs) {
  if (!knownTechs.has(tech)) {
    console.error(`Unknown tech: ${tech}`);
    process.exit(1);
  }
}
for (const kind of requestedKinds) {
  if (!knownKinds.has(kind)) {
    console.error(`Unknown kind: ${kind}`);
    process.exit(1);
  }
}

const reportNameTech = requestedTechs.join("-");
const defaultReportPath = path.join(
  projectRoot,
  "data",
  "interview-frequency",
  "reports",
  `importance-rubric-${reportNameTech}.report.json`
);
const reportPath = path.resolve(getArg("--report", defaultReportPath));
const noReport = hasFlag("--no-report");
const maxPromotionStep = Number.parseInt(getArg("--max-promotion-step", "2"), 10);
const maxDemotionStep = Number.parseInt(getArg("--max-demotion-step", "1"), 10);
const ignoreManualRubric = hasFlag("--ignore-manual-rubric");
const seedRubricDefaults = hasFlag("--seed-rubric-defaults");
const overwriteRubricDefaults = hasFlag("--overwrite-rubric-defaults");
const APPLY = hasFlag("--apply");

if (!Number.isInteger(maxPromotionStep) || maxPromotionStep < 0) {
  console.error("--max-promotion-step must be an integer >= 0");
  process.exit(1);
}
if (!Number.isInteger(maxDemotionStep) || maxDemotionStep < 0) {
  console.error("--max-demotion-step must be an integer >= 0");
  process.exit(1);
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  const normalized = normalizeText(value);
  if (!normalized) return [];
  return normalized.split(" ").filter(Boolean);
}

function clampInt(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalizeRubricValue(raw, min, max) {
  if (raw === undefined || raw === null || raw === "") return null;
  const parsed = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(parsed)) return null;
  return clampInt(parsed, min, max);
}

function rel(p) {
  return path.relative(projectRoot, p).split(path.sep).join("/");
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function loadJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

const coreConceptTokens = new Set([
  "closure",
  "scope",
  "hoisting",
  "promise",
  "async",
  "await",
  "event",
  "loop",
  "prototype",
  "this",
  "component",
  "state",
  "props",
  "hook",
  "render",
  "context",
  "dom",
  "performance",
]);

const mustKnowTokens = new Set([
  "closure",
  "scope",
  "hoisting",
  "promise",
  "async",
  "await",
  "event",
  "loop",
  "prototype",
  "this",
  "component",
  "state",
  "props",
  "hook",
]);

const detailTokens = new Set([
  "internals",
  "spec",
  "edge",
  "optimization",
  "scheduler",
  "fiber",
  "polyfill",
  "bytecode",
  "jit",
  "hydration",
]);

const companyTokens = new Set([
  "amazon",
  "google",
  "meta",
  "apple",
  "netflix",
  "uber",
  "airbnb",
  "facebook",
  "microsoft",
  "tesla",
]);

function countHits(tokens, dictionary) {
  let count = 0;
  for (const token of tokens) {
    if (dictionary.has(token)) count += 1;
  }
  return count;
}

function hasAnyPhrase(haystack, phrases) {
  return phrases.some((phrase) => haystack.includes(phrase));
}

function parseManualRubric(value) {
  if (!value || typeof value !== "object") return null;
  return {
    coreness: normalizeRubricValue(value.coreness, 0, 2),
    passCritical: normalizeRubricValue(value.passCritical, 0, 2),
    detailPenalty: normalizeRubricValue(value.detailPenalty, 0, 2),
    crossCompany: normalizeRubricValue(value.crossCompany, 0, 1),
    frequencyBonus: normalizeRubricValue(value.frequencyBonus, 0, 1),
  };
}

function computeRubric(question) {
  const manual = ignoreManualRubric ? null : question.manualRubric;
  const tokens = question.conceptTokens;
  const searchText = question.searchText;
  const coreHits = countHits(tokens, coreConceptTokens);
  const mustHits = countHits(tokens, mustKnowTokens);
  const detailHits = countHits(tokens, detailTokens);
  const companyHits = countHits(tokens, companyTokens);

  const hasCoreTag = question.tagsLower.includes("core") || question.tagsLower.includes("fundamentals");
  const hasBasicsTag = question.tagsLower.includes("basics");
  const hasDetailPhrase = hasAnyPhrase(searchText, [
    "implementation detail",
    "under the hood",
    "edge case",
    "spec detail",
  ]);

  let coreness = manual?.coreness ?? null;
  if (coreness === null) {
    if (hasCoreTag || mustHits >= 2) coreness = 2;
    else if (
      (question.kind === "coding" && (hasBasicsTag || coreHits >= 1 || mustHits >= 1))
      || (question.kind === "trivia" && (hasBasicsTag || coreHits >= 2 || mustHits >= 1))
    ) coreness = 1;
    else coreness = 0;
  }

  let passCritical = manual?.passCritical ?? null;
  if (passCritical === null) {
    if (coreness >= 2 && mustHits >= 1) passCritical = 2;
    else if (coreness >= 1 && (question.kind === "coding" || mustHits >= 1 || hasCoreTag)) passCritical = 1;
    else passCritical = 0;
  }

  let detailPenalty = manual?.detailPenalty ?? null;
  if (detailPenalty === null) {
    let penalty = 0;
    if (question.difficulty === "hard") penalty += 1;
    if (question.kind === "trivia" && mustHits === 0 && !hasCoreTag) penalty += 1;
    if (detailHits >= 1 || hasDetailPhrase) penalty += 1;
    if (hasCoreTag || mustHits >= 2) penalty -= 1;
    detailPenalty = clampInt(penalty, 0, 2);
  }

  let crossCompany = manual?.crossCompany ?? null;
  if (crossCompany === null) {
    if (question.companiesCount >= 2) crossCompany = 1;
    else if (question.companiesCount === 0 && hasCoreTag && mustHits >= 2 && companyHits === 0) crossCompany = 1;
    else crossCompany = 0;
  }

  let frequencyBonus = manual?.frequencyBonus ?? null;
  if (frequencyBonus === null) {
    frequencyBonus = 0;
  }

  const rawScore = 1 + coreness + passCritical + crossCompany + frequencyBonus - detailPenalty;
  const computedImportance = clampInt(rawScore, 1, 5);

  return {
    coreness,
    passCritical,
    detailPenalty,
    crossCompany,
    frequencyBonus,
    rawScore,
    computedImportance,
  };
}

function applyStepGuards(computed, current) {
  let next = computed;
  if (next > current) {
    const maxAllowed = Math.min(5, current + maxPromotionStep);
    if (next > maxAllowed) next = maxAllowed;
  }
  if (next < current) {
    const minAllowed = Math.max(1, current - maxDemotionStep);
    if (next < minAllowed) next = minAllowed;
  }
  return next;
}

async function loadQuestionCatalog(techs, kinds) {
  const questions = [];
  const files = [];

  for (const tech of techs) {
    for (const kind of kinds) {
      const filePath = path.join(questionsRoot, tech, `${kind}.json`);
      if (!(await fileExists(filePath))) {
        throw new Error(`Question file not found: ${rel(filePath)}`);
      }

      const data = await loadJson(filePath);
      if (!Array.isArray(data)) {
        throw new Error(`Expected array in ${rel(filePath)}`);
      }
      files.push(filePath);

      for (const q of data) {
        const title = String(q.title || "");
        const id = String(q.id || "");
        const tags = Array.isArray(q.tags) ? q.tags.map(String) : [];
        const difficulty = normalizeText(String(q.difficulty || ""));
        const companies = Array.isArray(q.companies)
          ? [...new Set(q.companies.map((c) => normalizeText(c)).filter(Boolean))]
          : [];

        questions.push({
          id,
          title,
          tech,
          kind,
          filePath,
          currentImportance: Number.isFinite(q.importance) ? q.importance : 1,
          difficulty,
          companiesCount: companies.length,
          tagsLower: tags.map((t) => normalizeText(t)).filter(Boolean),
          searchText: normalizeText(`${title} ${tags.join(" ")} ${id.replace(/-/g, " ")}`),
          conceptTokens: tokenize(`${title} ${tags.join(" ")} ${id.replace(/-/g, " ")}`),
          manualRubric: parseManualRubric(q.importanceRubric),
        });
      }
    }
  }

  return { questions, files };
}

async function writeUpdates(questionsByFile, rowById) {
  let filesChanged = 0;
  let importanceUpdated = 0;
  let rubricSeeded = 0;

  for (const filePath of questionsByFile.keys()) {
    const data = await loadJson(filePath);
    let localChanges = 0;

    for (const q of data) {
      const row = rowById.get(String(q.id || ""));
      if (!row) continue;

      if (APPLY && q.importance !== row.proposedImportance) {
        q.importance = row.proposedImportance;
        localChanges += 1;
        importanceUpdated += 1;
      }

      if (seedRubricDefaults) {
        const computedRubric = {
          coreness: row.rubric.coreness,
          passCritical: row.rubric.passCritical,
          detailPenalty: row.rubric.detailPenalty,
          crossCompany: row.rubric.crossCompany,
          frequencyBonus: row.rubric.frequencyBonus,
        };

        const current = q.importanceRubric && typeof q.importanceRubric === "object"
          ? q.importanceRubric
          : {};

        const next = overwriteRubricDefaults
          ? computedRubric
          : {
            coreness: current.coreness ?? computedRubric.coreness,
            passCritical: current.passCritical ?? computedRubric.passCritical,
            detailPenalty: current.detailPenalty ?? computedRubric.detailPenalty,
            crossCompany: current.crossCompany ?? computedRubric.crossCompany,
            frequencyBonus: current.frequencyBonus ?? computedRubric.frequencyBonus,
          };

        if (JSON.stringify(current) !== JSON.stringify(next)) {
          q.importanceRubric = next;
          localChanges += 1;
          rubricSeeded += 1;
        }
      }
    }

    if (localChanges > 0) {
      await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
      filesChanged += 1;
    }
  }

  return { filesChanged, importanceUpdated, rubricSeeded };
}

async function main() {
  const { questions } = await loadQuestionCatalog(requestedTechs, requestedKinds);

  const questionRows = questions.map((q) => {
    const rubric = computeRubric(q);
    const proposedImportance = applyStepGuards(rubric.computedImportance, q.currentImportance);
    return {
      id: q.id,
      title: q.title,
      tech: q.tech,
      kind: q.kind,
      filePath: rel(q.filePath),
      currentImportance: q.currentImportance,
      computedImportance: rubric.computedImportance,
      proposedImportance,
      delta: proposedImportance - q.currentImportance,
      rubric: {
        coreness: rubric.coreness,
        passCritical: rubric.passCritical,
        detailPenalty: rubric.detailPenalty,
        crossCompany: rubric.crossCompany,
        frequencyBonus: rubric.frequencyBonus,
        rawScore: rubric.rawScore,
      },
    };
  });

  const changedRows = questionRows
    .filter((q) => q.delta !== 0)
    .sort((a, b) => {
      if (Math.abs(b.delta) !== Math.abs(a.delta)) return Math.abs(b.delta) - Math.abs(a.delta);
      if (b.rubric.rawScore !== a.rubric.rawScore) return b.rubric.rawScore - a.rubric.rawScore;
      return a.id.localeCompare(b.id);
    });

  const report = {
    generatedAt: new Date().toISOString(),
    formulaVersion: "rubric-v1-no-frequency",
    scope: {
      tech: requestedTechs,
      kind: requestedKinds,
      maxPromotionStep,
      maxDemotionStep,
      ignoreManualRubric,
      seedRubricDefaults,
      overwriteRubricDefaults,
      apply: APPLY,
    },
    stats: {
      questionsTotal: questionRows.length,
      questionsChanged: changedRows.length,
      promotions: changedRows.filter((c) => c.delta > 0).length,
      demotions: changedRows.filter((c) => c.delta < 0).length,
    },
    changes: changedRows,
    questionRows: questionRows.sort((a, b) => {
      if (b.proposedImportance !== a.proposedImportance) return b.proposedImportance - a.proposedImportance;
      if (b.rubric.rawScore !== a.rubric.rawScore) return b.rubric.rawScore - a.rubric.rawScore;
      return a.id.localeCompare(b.id);
    }),
  };

  if (!noReport) {
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  if (APPLY || seedRubricDefaults) {
    const rowsById = new Map(questionRows.map((r) => [r.id, r]));
    const questionsByFile = new Map();
    for (const q of questions) {
      if (!questionsByFile.has(q.filePath)) questionsByFile.set(q.filePath, true);
    }
    const { filesChanged, importanceUpdated, rubricSeeded } = await writeUpdates(questionsByFile, rowsById);

    if (APPLY) {
      console.log(`Applied importance updates to ${importanceUpdated} questions across ${filesChanged} files.`);
    }
    if (seedRubricDefaults) {
      console.log(`Seeded rubric defaults for ${rubricSeeded} questions across ${filesChanged} files.`);
    }
  }

  console.log(`Scanned ${questionRows.length} questions in scope.`);
  console.log(`Proposed changes: ${changedRows.length}.`);
  if (noReport) {
    console.log("Skipped report write (--no-report).");
  } else {
    console.log(`Wrote report: ${rel(reportPath)}`);
  }
}

main().catch((err) => {
  console.error(err?.stack || err?.message || String(err));
  process.exit(1);
});
