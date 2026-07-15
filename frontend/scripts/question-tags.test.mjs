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
const repoRoot = path.resolve(projectRoot, "..");

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
  const staleManualSelectorPattern = new RegExp("html" + "\\.theme-dark");

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
    errors.push("css/coding.json: css-theme-variables-dark-mode: solution preview HTML must demonstrate the theme-dark root class");
  }
  if (/>Action</i.test(`${starterHtml}\n${solutionHtml}`)) {
    errors.push("css/coding.json: css-theme-variables-dark-mode: sample button label should not imply a functional click action");
  }
  if (!solutionCss.includes("--panel-shadow: 0 1px 2px rgb(0 0 0 / 0.4)")) {
    errors.push("css/coding.json: css-theme-variables-dark-mode: solution CSS must define the dark --panel-shadow token");
  }
  for (const [label, css] of [["solution", solutionCss], ["approach", approachCss]]) {
    if (!css.includes(":root:where(.theme-dark)")) {
      errors.push(`css/coding.json: css-theme-variables-dark-mode: ${label} CSS must use :root:where(.theme-dark)`);
    }
    if (staleManualSelectorPattern.test(css)) {
      errors.push(`css/coding.json: css-theme-variables-dark-mode: ${label} CSS must not rely on a higher-specificity manual root selector`);
    }
    if (css.indexOf(":root:where(.theme-dark)") < css.indexOf("@media (prefers-color-scheme: dark)")) {
      errors.push(`css/coding.json: css-theme-variables-dark-mode: ${label} manual rule must follow the media query`);
    }
  }
  const renderedContract = JSON.stringify(challenge);
  if (!/equal specificity/i.test(renderedContract) || !/source order/i.test(renderedContract)) {
    errors.push("css/coding.json: css-theme-variables-dark-mode: explanation must teach equal specificity and source order");
  }
  if (staleManualSelectorPattern.test(renderedContract)) {
    errors.push("css/coding.json: css-theme-variables-dark-mode: stale higher-specificity manual selector explanation remains");
  }
  if (challenge?.access !== "free") {
    errors.push("css/coding.json: css-theme-variables-dark-mode: challenge must remain free");
  }
}

async function assertEditorialCorrections(errors) {
  const readQuestion = async (technology, kind, id) => {
    const catalog = JSON.parse(await fs.readFile(path.join(questionsRoot, technology, `${kind}.json`), "utf8"));
    return catalog.find((entry) => entry?.id === id);
  };

  const reactTiming = await readQuestion("react", "trivia", "react-useeffect-vs-uselayouteffect");
  const reactContract = JSON.stringify(reactTiming || {});
  if (!reactTiming || reactTiming.updatedAt !== "2026-07-14") {
    errors.push("react/trivia.json: react-useeffect-vs-uselayouteffect: missing current correction date");
  }
  if (!/generally run after paint for non-interaction updates/i.test(reactContract)
      || !/interaction-caused effect before paint/i.test(reactContract)
      || !/does not provide a pre-paint guarantee/i.test(reactContract)) {
    errors.push("react/trivia.json: react-useeffect-vs-uselayouteffect: missing qualified useEffect timing model");
  }
  if (/useEffect runs (?:<strong>)?after the browser paints|useEffect runs after paint and is non-blocking/i.test(reactContract)) {
    errors.push("react/trivia.json: react-useeffect-vs-uselayouteffect: stale absolute after-paint claim remains");
  }

  const vueWatch = await readQuestion("vue", "trivia", "vue-watch-vs-watcheffect-differences-infinite-loops");
  const vueContract = JSON.stringify(vueWatch || {});
  if (!vueWatch || vueWatch.updatedAt !== "2026-07-14") {
    errors.push("vue/trivia.json: watch-vs-watchEffect: missing current correction date");
  }
  if (!vueContract.includes("watch(count, () =>")
      || !/direct synchronous.*watchEffect.*suppressed/i.test(vueContract)) {
    errors.push("vue/trivia.json: watch-vs-watchEffect: missing real watch recursion and watchEffect protection model");
  }
  if (/\/\/ ❌ Infinite loop\\nwatchEffect/.test(vueContract)) {
    errors.push("vue/trivia.json: watch-vs-watchEffect: direct watchEffect self-mutation is still labeled an infinite loop");
  }

  const angularForms = await readQuestion("angular", "trivia", "angular-template-driven-vs-reactive-forms-which-scales");
  const angularContract = JSON.stringify(angularForms || {});
  if (!angularForms || angularForms.updatedAt !== "2026-07-14") {
    errors.push("angular/trivia.json: forms comparison: missing current correction date");
  }
  if (!/Signal Forms are stable|stable Signal Forms/i.test(angularContract)
      || !/production option/i.test(angularContract)
      || /Signal Forms[^.]{0,80}experimental/i.test(angularContract)) {
    errors.push("angular/trivia.json: forms comparison: Signal Forms must be a stable production option, not experimental");
  }

  const progress = await readQuestion("react", "coding", "react-progress-bar-thresholds");
  const progressContract = JSON.stringify(progress || {});
  if (!progress || progress.updatedAt !== "2026-07-14") {
    errors.push("react/coding.json: react-progress-bar-thresholds: missing current correction date");
  }
  if (!progressContract.includes("&lt;34") || !progressContract.includes("&gt;66")) {
    errors.push("react/coding.json: react-progress-bar-thresholds: threshold comparators must be entity-encoded canonically");
  }
  if (progress?.access !== "premium"
      || progress?.sdk?.asset !== "assets/sb/react/question/react-progress-bar-thresholds.v1.json"
      || progress?.solutionAsset !== "assets/sb/react/solution/react-progress-bar-thresholds-solution.v1.json") {
    errors.push("react/coding.json: react-progress-bar-thresholds: premium/solution boundary changed");
  }

  const imageLinkTrivia = await readQuestion("html", "trivia", "html-clickable-image");
  const imageLinkCoding = await readQuestion("html", "coding", "html-links-and-images");
  for (const [kind, question] of [["trivia", imageLinkTrivia], ["coding", imageLinkCoding]]) {
    const contract = JSON.stringify(question || {});
    if (!question || question.updatedAt !== "2026-07-14") {
      errors.push(`html/${kind}.json: image-link content: missing current correction date`);
    }
    if (question?.access !== "free") {
      errors.push(`html/${kind}.json: image-link content: free access boundary changed`);
    }
    if (!/anchor without href is not a hyperlink/i.test(contract)
        || !/<a (?:href=|href\\=)/i.test(contract)) {
      errors.push(`html/${kind}.json: image-link content: must require a real href and explain anchor semantics`);
    }
  }

  const interviewHub = await fs.readFile(
    path.join(projectRoot, "src/app/features/interview-questions/interview-questions-landing.component.ts"),
    "utf8",
  );
  if (interviewHub.includes('<a><img alt="arrow"></a>')
      || !interviewHub.includes('<a href="/pricing"><img alt="arrow"></a>')
      || !/anchor without href is not a hyperlink/i.test(interviewHub)) {
    errors.push("interview questions: image-link examples must use a safe href and teach that href creates the hyperlink");
  }

  for (const relative of [
    "src/app/features/interview-questions/interview-questions-landing.component.ts",
    "src/app/features/interview-questions/essential-questions.component.ts",
    "src/app/features/showcase/showcase.page.html",
    "src/app/features/interview-questions/machine-coding-hub.component.html",
    "src/app/features/coding/coding-list/coding-list.component.html",
    "src/app/features/tracks/track-list/track-list.component.html",
    "src/app/features/company/company-preview/company-preview.component.html",
    "src/app/features/system-design-list/system-design-list.component.html",
    "src/app/features/system-design-list/system-design-list.component.ts",
  ]) {
    const content = await fs.readFile(path.join(projectRoot, relative), "utf8");
    for (const forbidden of [
      "crawlable focus links",
      "thin keyword pages",
      "crawlable entry points",
      "search-engine quality content",
      "free, indexable pages",
      "use these crawlable routes",
      "long-tail prompts",
      "internal prompt paths",
      "preview pages stay indexable",
      "FrontendAtlas metadata",
      "importance signals",
      "shipped FrontendAtlas practice routes",
      "items point to shipped FrontendAtlas routes",
    ]) {
      if (content.toLowerCase().includes(forbidden.toLowerCase())) {
        errors.push(`${relative}: user-facing internal editorial phrase remains: ${forbidden}`);
      }
    }
  }

  for (const relative of [
    "content-reviews/trivia/angular/angular-template-driven-vs-reactive-forms-which-scales.json",
    "content-reviews/trivia/html/html-clickable-image.json",
    "content-reviews/trivia/react/react-useeffect-vs-uselayouteffect.json",
    "content-reviews/trivia/vue/vue-watch-vs-watcheffect-differences-infinite-loops.json",
  ]) {
    const review = JSON.parse(await fs.readFile(path.join(repoRoot, relative), "utf8"));
    if (review.reviewedAt !== "2026-07-14") {
      errors.push(`${relative}: current review date must be 2026-07-14`);
    }
    if (relative.includes("angular-template-driven")
        && (!/stable Signal Forms|Signal Forms in Angular 22 are a production option/i.test(JSON.stringify(review))
          || /Signal Forms[^.]{0,80}experimental/i.test(JSON.stringify(review)))) {
      errors.push(`${relative}: current review must include stable Signal Forms as a production option`);
    }
    if (relative.includes("html-clickable-image")
        && !/anchor without href is not a hyperlink/i.test(JSON.stringify(review))) {
      errors.push(`${relative}: current review must capture the corrected href/hyperlink model`);
    }
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
await assertEditorialCorrections(errors);

if (errors.length) {
  report("Question tag checks failed", errors);
  process.exit(1);
}

console.log("Question tag checks passed.");
