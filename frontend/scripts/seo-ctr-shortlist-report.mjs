import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('..');
const CDN_ROOT = path.join(ROOT, 'cdn', 'questions');
const INPUT = path.resolve('scripts', 'seo-ctr-shortlist.json');
const OUTPUT = path.join(ROOT, 'docs', 'seo', 'ctr-shortlist-report.md');

const TECH_LABEL = {
  javascript: 'JavaScript',
  react: 'React',
  angular: 'Angular',
  vue: 'Vue',
  html: 'HTML',
  css: 'CSS',
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalize(input, maxLen = 160) {
  const text = String(input || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return `${text.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
}

function escapeCell(value) {
  return String(value || '')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ');
}

function descriptionFromQuestion(question) {
  const desc = question?.description;
  if (typeof desc === 'string') return desc;
  if (desc && typeof desc === 'object') return desc.summary || desc.text || '';
  return '';
}

function loadTriviaMaps() {
  const maps = new Map();
  for (const tech of Object.keys(TECH_LABEL)) {
    const file = path.join(CDN_ROOT, tech, 'trivia.json');
    if (!fs.existsSync(file)) continue;
    const list = readJson(file);
    const byId = new Map(list.map((q) => [q.id, q]));
    maps.set(tech, byId);
  }
  return maps;
}

function fallbackTitleB(tech, slug, currentTitle) {
  const framework = TECH_LABEL[tech] || 'Frontend';
  const concept = normalize(
    (currentTitle || slug || '')
      .replace(/\?+$/, '')
      .replace(/^(what|why|how)\s+/i, ''),
    52
  );
  return normalize(`${framework} ${concept}: Common Mistakes and Best Practices`, 76);
}

function schemaByType(type) {
  if (type === 'trivia') {
    return 'Keep BreadcrumbList + TechArticle + FAQ (if visible answer exists).';
  }
  if (type === 'guide') {
    return 'Add dynamic BreadcrumbList + TechArticle on slug host.';
  }
  if (type === 'coding-search') {
    return 'No new schema; remove SearchAction and force noindex/canonical cleanup.';
  }
  if (type === 'home-http') {
    return 'No schema change; enforce https canonical origin redirect.';
  }
  return 'Template-level metadata normalization.';
}

function filesByType(type, tech = '') {
  if (type === 'trivia') {
    return [
      `cdn/questions/${tech}/trivia.json`,
      `frontend/src/assets/questions/${tech}/trivia.json`,
      'frontend/src/app/features/trivia/trivia-detail/trivia-seo.util.ts',
      'frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts',
      'frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.html',
    ].join(', ');
  }
  if (type === 'guide') {
    return [
      'frontend/src/app/features/guides/guide-seo.util.ts',
      'frontend/src/app/features/guides/system-design/system-design-host.component.ts',
      'frontend/src/app/features/guides/playbook/playbook-host.component.ts',
      'frontend/src/app/features/guides/behavioral/behavioral-host.component.ts',
    ].join(', ');
  }
  if (type === 'coding-search') {
    return [
      'frontend/src/app/features/coding/coding-list/coding-list-seo.util.ts',
      'frontend/src/app/features/coding/coding-list/coding-list.component.ts',
      'frontend/src/app/core/services/seo.service.ts',
      'frontend/src/robots.txt',
    ].join(', ');
  }
  if (type === 'home-http') {
    return ['frontend/src/main.ts', 'frontend/src/app/core/services/seo.service.ts'].join(', ');
  }
  return '';
}

function buildRows(shortlist, triviaMaps) {
  return shortlist.map((item) => {
    const rawUrl = String(item.url || '').trim();
    const parsed = rawUrl.startsWith('http') ? new URL(rawUrl) : new URL(`https://frontendatlas.com${rawUrl}`);
    const pathname = parsed.pathname || '/';
    const segments = pathname.split('/').filter(Boolean);

    if (item.type === 'trivia' && segments.length >= 3) {
      const tech = segments[0];
      const slug = segments[2];
      const byId = triviaMaps.get(tech);
      const question = byId?.get(slug);

      const currentTitle = normalize(question?.title || 'Front-end trivia question', 120);
      const currentMeta = normalize(descriptionFromQuestion(question), 180);
      const proposedTitle = normalize(question?.seo?.title || currentTitle, 120);
      const proposedMeta = normalize(question?.seo?.description || currentMeta, 180);
      const titleB = fallbackTitleB(tech, slug, question?.title || slug);

      return {
        url: rawUrl,
        currentTitle,
        proposedTitle,
        titleB,
        currentMeta,
        proposedMeta,
        schemaChanges: schemaByType(item.type),
        filesTouched: filesByType(item.type, tech),
      };
    }

    if (item.type === 'coding-search') {
      return {
        url: rawUrl,
        currentTitle: 'Front-end coding interview questions',
        proposedTitle: 'Front-end Coding Interview Questions (Canonical List)',
        titleB: 'Frontend Coding Questions: Filtered Practice Library',
        currentMeta: 'Solve curated front-end coding interview questions with filters for tech, difficulty, and tags.',
        proposedMeta: 'Canonical coding list URL. Query/filter variants are noindex to avoid duplicate snippets and preserve CTR on the main /coding page.',
        schemaChanges: schemaByType(item.type),
        filesTouched: filesByType(item.type),
      };
    }

    if (item.type === 'guide') {
      return {
        url: rawUrl,
        currentTitle: 'Frontend System Design Blueprint',
        proposedTitle: 'Rendering & App Architecture',
        titleB: 'Frontend System Design: Rendering & Architecture Trade-offs',
        currentMeta: 'Detailed walkthroughs for individual front-end system design topics.',
        proposedMeta: 'Understand CSR, SSR, islands, and microfrontend trade-offs with interview-ready architecture reasoning and practical frontend examples.',
        schemaChanges: schemaByType(item.type),
        filesTouched: filesByType(item.type),
      };
    }

    return {
      url: rawUrl,
      currentTitle: 'High-signal frontend interview prep',
      proposedTitle: 'High-signal Frontend Interview Prep Platform',
      titleB: 'FrontendAtlas: Coding, Trivia, and System Design Prep',
      currentMeta: 'FrontendAtlas — High-signal frontend interview preparation platform.',
      proposedMeta: 'Force canonical https://frontendatlas.com origin and unify protocol/host variants so home-page snippets and CTR signals consolidate correctly.',
      schemaChanges: schemaByType(item.type),
      filesTouched: filesByType(item.type),
    };
  });
}

function toMarkdown(rows) {
  const header = [
    '# SEO CTR shortlist report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '| URL | Current title | Proposed title (A implemented) | Title option B | Current meta | Proposed meta | Schema changes | Files touched |',
    '|---|---|---|---|---|---|---|---|',
  ];

  const lines = rows.map((row) => [
    row.url,
    row.currentTitle,
    row.proposedTitle,
    row.titleB,
    row.currentMeta,
    row.proposedMeta,
    row.schemaChanges,
    row.filesTouched,
  ].map(escapeCell).join(' | '));

  return `${header.join('\n')}\n${lines.map((line) => `| ${line} |`).join('\n')}\n`;
}

const shortlist = readJson(INPUT);
const triviaMaps = loadTriviaMaps();
const rows = buildRows(shortlist, triviaMaps);
const markdown = toMarkdown(rows);

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, markdown, 'utf8');
console.log(`CTR shortlist report generated: ${OUTPUT}`);
