#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { repoRoot } from './content-paths.mjs';

const ROOT = path.resolve(process.env.CONTENT_DRAFTS_DIR || path.join(repoRoot, 'content-drafts'));
const TEMPLATE_FILES = new Set([
  'playbooks/playbook.md',
  'system-design/system-design.md',
  'trivia/trivia.md',
  'tradeoff-battles/tradeoff-battle.md',
  'incidents/incident.md',
]);
const README_FILE = 'README.md';
const REQUIRED_FIELDS = [
  'title',
  'slug',
  'family',
  'tech',
  'audience',
  'intent',
  'target_words',
  'primary_keyword',
  'status',
  'notes_for_conversion',
];
const STRING_FIELDS = [
  'title',
  'slug',
  'family',
  'tech',
  'audience',
  'intent',
  'primary_keyword',
  'status',
];
const EDITORIAL_STRING_FIELDS = [
  'search_intent',
  'reader_promise',
  'unique_angle',
  'what_this_adds_beyond_basics',
  'competitor_query',
];
const ALLOWED_STATUSES = new Set(['brief', 'outline', 'drafting', 'editing', 'approved', 'converted']);
const SHIPPING_STATUSES = new Set(['approved', 'converted']);
const REVIEW_STATUSES = new Set(['editing']);
const EDITORIAL_STATUSES = new Set(['outline', 'drafting', 'editing', 'approved', 'converted']);
const ALLOWED_CONFIDENCE = new Set(['low', 'medium', 'high']);

const FAMILY_RULES = {
  playbook: {
    dir: 'playbooks',
    headings: ['Hook', 'Problem', 'Framework', 'Examples', 'Common Mistakes', 'CTA', 'Internal Links'],
    minWords: 850,
    minSources: 1,
  },
  'system-design': {
    dir: 'system-design',
    headings: ['Prompt', 'Clarifying Questions', 'Architecture', 'Tradeoffs', 'Failure Modes', 'Metrics', 'Rollout'],
    minWords: 900,
    minSources: 2,
  },
  trivia: {
    dir: 'trivia',
    headings: ['Question', 'Short Answer', 'Deeper Explanation', 'Example', 'Common Pitfall', 'Follow-Up'],
    minWords: 350,
    minSources: 1,
  },
  'tradeoff-battle': {
    dir: 'tradeoff-battles',
    headings: ['Scenario', 'Prompt', 'Option A', 'Option B', 'Decision Matrix', 'Strong Answer', 'Pushback', 'Anti-Patterns'],
    minWords: 700,
    minSources: 1,
  },
  incident: {
    dir: 'incidents',
    headings: ['Symptom', 'Impact', 'Evidence', 'Stages', 'Debrief', 'Ideal Runbook', 'Related Practice'],
    minWords: 800,
    minSources: 2,
  },
};

const errors = [];
const warnings = [];

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

function addError(filePath, message) {
  errors.push(`${rel(filePath)}: ${message}`);
}

function addWarning(filePath, message) {
  warnings.push(`${rel(filePath)}: ${message}`);
}

function parseScalar(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  return value;
}

function isValidDateOnly(value) {
  const raw = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  const date = new Date(`${raw}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === raw;
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean);
}

function parseFrontmatter(raw, filePath) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    addError(filePath, 'missing YAML frontmatter block');
    return { frontmatter: null, body: raw };
  }

  const frontmatter = {};
  const lines = match[1].split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;

    const pair = line.match(/^([a-z_]+):(.*)$/);
    if (!pair) {
      addError(filePath, `invalid frontmatter line: ${line}`);
      continue;
    }

    const key = pair[1];
    const rawValue = pair[2].trim();
    if (!rawValue) {
      const items = [];
      let cursor = index + 1;
      while (cursor < lines.length && /^\s+-\s+/.test(lines[cursor])) {
        items.push(String(lines[cursor]).replace(/^\s+-\s+/, '').trim().replace(/^"(.*)"$/, '$1'));
        cursor += 1;
      }
      frontmatter[key] = items;
      index = cursor - 1;
      continue;
    }

    frontmatter[key] = parseScalar(rawValue);
  }

  return {
    frontmatter,
    body: raw.slice(match[0].length),
  };
}

function collectMarkdownFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectMarkdownFiles(fullPath, out);
      return;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) out.push(fullPath);
  });
  return out;
}

function normalizeText(input) {
  return String(input || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(input) {
  const text = normalizeText(input);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function extractSections(body) {
  const sections = new Map();
  const matches = Array.from(body.matchAll(/^# (.+)$/gm));
  matches.forEach((match, index) => {
    const title = String(match[1] || '').trim();
    const start = (match.index || 0) + match[0].length;
    const end = index + 1 < matches.length ? (matches[index + 1].index || body.length) : body.length;
    sections.set(title, body.slice(start, end).trim());
  });
  return sections;
}

function isPlaceholderSection(content) {
  const lines = String(content || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return true;
  return lines.every((line) => /^\[[\s\S]*\]$/.test(line.replace(/^[-*]\s+/, '').trim()));
}

function countListItems(content) {
  return String(content || '').match(/^\s*(?:-|\d+\.)\s+/gm)?.length || 0;
}

function expectedFamilyFromPath(filePath) {
  const relative = rel(filePath);
  const matched = Object.entries(FAMILY_RULES).find(([, rule]) => relative.startsWith(`${rule.dir}/`));
  return matched?.[0] || '';
}

function shouldSkip(filePath) {
  const relative = rel(filePath);
  return relative === README_FILE || TEMPLATE_FILES.has(relative);
}

function validateFrontmatter(frontmatter, filePath) {
  if (!frontmatter || typeof frontmatter !== 'object') return;

  REQUIRED_FIELDS.forEach((field) => {
    if (!(field in frontmatter)) addError(filePath, `missing required frontmatter field "${field}"`);
  });

  STRING_FIELDS.forEach((field) => {
    const value = String(frontmatter[field] || '').trim();
    if (!value) addError(filePath, `frontmatter "${field}" must be a non-empty string`);
  });

  const targetWords = Number(frontmatter.target_words);
  if (!Number.isFinite(targetWords) || targetWords <= 0) {
    addError(filePath, 'frontmatter "target_words" must be a positive number');
  }

  const notes = Array.isArray(frontmatter.notes_for_conversion) ? frontmatter.notes_for_conversion : [];
  if (!notes.length || notes.some((item) => !String(item || '').trim())) {
    addError(filePath, 'frontmatter "notes_for_conversion" must contain at least one non-empty item');
  }

  const family = String(frontmatter.family || '').trim();
  const expectedFamily = expectedFamilyFromPath(filePath);
  if (family && expectedFamily && family !== expectedFamily) {
    addError(filePath, `frontmatter family "${family}" does not match directory family "${expectedFamily}"`);
  }

  const slug = String(frontmatter.slug || '').trim();
  if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    addError(filePath, 'frontmatter "slug" must be kebab-case');
  }

  if (slug) {
    const fileName = path.basename(filePath, '.md');
    if (fileName !== slug) {
      addError(filePath, `file name must match slug ("${slug}.md")`);
    }
  }

  const status = String(frontmatter.status || '').trim();
  if (status && !ALLOWED_STATUSES.has(status)) {
    addError(filePath, `frontmatter status must be one of: ${Array.from(ALLOWED_STATUSES).join(', ')}`);
  }

  if (status && EDITORIAL_STATUSES.has(status)) {
    EDITORIAL_STRING_FIELDS.forEach((field) => {
      const value = String(frontmatter[field] || '').trim();
      if (!value) addError(filePath, `frontmatter "${field}" must be a non-empty string for ${status} drafts`);
    });
  }

  const rules = FAMILY_RULES[family];
  const isReview = REVIEW_STATUSES.has(status);
  const isShipping = SHIPPING_STATUSES.has(status);
  const competitorTakeaways = normalizeStringArray(frontmatter.competitor_takeaways);
  const competitorGaps = normalizeStringArray(frontmatter.competitor_gaps);
  const sources = normalizeStringArray(frontmatter.sources);
  const competitorReviewFile = String(frontmatter.competitor_review_file || '').trim();

  if (isReview || isShipping) {
    const competitorTakeawayMessage = 'frontmatter competitor_takeaways must contain at least 2 non-empty items';
    if (competitorTakeaways.length < 2) {
      if (isShipping) addError(filePath, competitorTakeawayMessage);
      else addWarning(filePath, competitorTakeawayMessage);
    }

    const competitorGapMessage = 'frontmatter competitor_gaps must contain at least 2 non-empty items';
    if (competitorGaps.length < 2) {
      if (isShipping) addError(filePath, competitorGapMessage);
      else addWarning(filePath, competitorGapMessage);
    }

    if (sources.some((item) => !/^https?:\/\//i.test(item))) {
      const message = 'frontmatter sources must contain only public http(s) URLs';
      if (isShipping) addError(filePath, message);
      else addWarning(filePath, message);
    }
  }

  if (family === 'trivia' && (isReview || isShipping)) {
    const expectedReviewPath = `content-reviews/trivia/${String(frontmatter.tech || '').trim()}/${slug}.json`;
    if (!competitorReviewFile) {
      const message = 'frontmatter competitor_review_file is required for trivia editing/approved/converted drafts';
      if (isShipping) addError(filePath, message);
      else addWarning(filePath, message);
    } else {
      const normalizedReviewPath = competitorReviewFile.replace(/\\/g, '/');
      const message = `frontmatter competitor_review_file must point to "${expectedReviewPath}"`;
      if (normalizedReviewPath !== expectedReviewPath) {
        if (isShipping) addError(filePath, message);
        else addWarning(filePath, message);
      }
    }
  }

  if (isReview) {
    if (!sources.length) addWarning(filePath, 'frontmatter sources should contain at least 1 public source before approval');
    const factCheckDate = String(frontmatter.last_fact_checked_at || '').trim();
    if (!factCheckDate) {
      addWarning(filePath, 'frontmatter last_fact_checked_at should be filled before approval');
    } else if (!isValidDateOnly(factCheckDate)) {
      addWarning(filePath, 'frontmatter last_fact_checked_at must use YYYY-MM-DD');
    }
    if (!String(frontmatter.reviewed_by || '').trim()) {
      addWarning(filePath, 'frontmatter reviewed_by should be filled before approval');
    }
    const confidence = String(frontmatter.confidence || '').trim();
    if (!confidence) {
      addWarning(filePath, 'frontmatter confidence should be filled before approval');
    } else if (!ALLOWED_CONFIDENCE.has(confidence)) {
      addWarning(filePath, `frontmatter confidence must be one of: ${Array.from(ALLOWED_CONFIDENCE).join(', ')}`);
    }
  }

  if (isShipping) {
    const requiredSourceCount = rules?.minSources || 1;
    if (sources.length < requiredSourceCount) {
      addError(filePath, `frontmatter sources must contain at least ${requiredSourceCount} public source(s) for ${family} drafts`);
    }

    const factCheckDate = String(frontmatter.last_fact_checked_at || '').trim();
    if (!factCheckDate) {
      addError(filePath, 'frontmatter last_fact_checked_at is required for approved/converted drafts');
    } else if (!isValidDateOnly(factCheckDate)) {
      addError(filePath, 'frontmatter last_fact_checked_at must use YYYY-MM-DD');
    }

    if (!String(frontmatter.reviewed_by || '').trim()) {
      addError(filePath, 'frontmatter reviewed_by is required for approved/converted drafts');
    }

    const confidence = String(frontmatter.confidence || '').trim();
    if (!confidence) {
      addError(filePath, 'frontmatter confidence is required for approved/converted drafts');
    } else if (!ALLOWED_CONFIDENCE.has(confidence)) {
      addError(filePath, `frontmatter confidence must be one of: ${Array.from(ALLOWED_CONFIDENCE).join(', ')}`);
    }
  }

  const placeholders = [
    ['title', 'Working Title'],
    ['slug', 'working-slug'],
    ['primary_keyword', 'replace-with-primary-keyword'],
  ];
  placeholders.forEach(([field, blockedValue]) => {
    if (String(frontmatter[field] || '').trim() === blockedValue) {
      addError(filePath, `frontmatter "${field}" still uses the template placeholder`);
    }
  });
}

function validateBody(frontmatter, body, filePath) {
  const family = String(frontmatter.family || '').trim();
  const rules = FAMILY_RULES[family];
  if (!rules) {
    addError(filePath, `unknown family "${family}"`);
    return;
  }

  if (!String(body || '').trim()) {
    addError(filePath, 'body content is empty');
    return;
  }

  const sections = extractSections(body);
  rules.headings.forEach((heading) => {
    if (!sections.has(heading)) {
      addError(filePath, `missing required section heading "# ${heading}"`);
    }
  });

  const status = String(frontmatter.status || '').trim();
  const isReview = REVIEW_STATUSES.has(status);
  const isShipping = SHIPPING_STATUSES.has(status);
  const shouldEvaluateDepth = isReview || isShipping;

  if (!shouldEvaluateDepth) return;

  rules.headings.forEach((heading) => {
    const content = sections.get(heading);
    if (!content) return;

    if (heading === 'Internal Links') {
      const itemCount = countListItems(content);
      if (itemCount < 2) {
        const message = 'Internal Links section should contain at least 2 list items';
        if (isShipping) addError(filePath, message);
        else addWarning(filePath, message);
      }
      return;
    }

    if (isPlaceholderSection(content)) {
      const message = `section "${heading}" still contains placeholder text`;
      if (isShipping) addError(filePath, message);
      else addWarning(filePath, message);
      return;
    }

    if (countWords(content) < 8) {
      const message = `section "${heading}" is too thin to be useful`;
      if (isShipping) addError(filePath, message);
      else addWarning(filePath, message);
    }
  });

  const bodyWordCount = countWords(body);
  const targetWords = Number(frontmatter.target_words) || 0;
  const minWords = Math.max(rules.minWords, Math.floor(targetWords * 0.55));
  if (bodyWordCount < minWords) {
    const message = `body is too short for ${status} status (${bodyWordCount} words, expected at least ${minWords})`;
    if (isShipping) addError(filePath, message);
    else addWarning(filePath, message);
  }

  if (/VERIFY:/i.test(body)) {
    const message = 'contains unresolved VERIFY markers';
    if (isShipping) addError(filePath, message);
    else addWarning(filePath, message);
  }

  const keyword = normalizeText(frontmatter.primary_keyword).toLowerCase();
  if (keyword && !normalizeText(body).toLowerCase().includes(keyword)) {
    addWarning(filePath, `primary keyword "${frontmatter.primary_keyword}" does not appear in the body text`);
  }
}

function main() {
  if (!fs.existsSync(ROOT)) {
    console.log('[lint-content-drafts] content-drafts/ not found; skipping.');
    return;
  }

  const files = collectMarkdownFiles(ROOT).filter((filePath) => !shouldSkip(filePath));
  files.forEach((filePath) => {
    const raw = fs.readFileSync(filePath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(raw, filePath);
    validateFrontmatter(frontmatter, filePath);
    if (frontmatter) validateBody(frontmatter, body, filePath);
  });

  warnings.forEach((message) => console.warn(`[lint-content-drafts] WARN ${message}`));
  errors.forEach((message) => console.error(`[lint-content-drafts] ${message}`));

  if (errors.length) {
    console.error(`[lint-content-drafts] failed with ${errors.length} error(s) and ${warnings.length} warning(s).`);
    process.exit(1);
  }

  console.log(`[lint-content-drafts] content drafts look valid (${files.length} file(s) checked).`);
  if (warnings.length) {
    console.log(`[lint-content-drafts] warnings: ${warnings.length}`);
  }
}

main();
