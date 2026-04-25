#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { cdnQuestionsDir, guideRegistryPath, repoRoot } from './content-paths.mjs';

const REGISTRY_PATH = path.resolve(process.env.GUIDE_REGISTRY_PATH || guideRegistryPath);
const QUESTIONS_DIR = path.resolve(process.env.CDN_QUESTIONS_DIR || cdnQuestionsDir);
const GUIDE_COLLECTIONS = ['PLAYBOOK', 'SYSTEM', 'BEHAVIORAL'];
const TECH_TOKENS = new Set(['javascript', 'js', 'typescript', 'react', 'angular', 'vue', 'css', 'html']);
const STOPWORDS = new Set(['what', 'how', 'why', 'does', 'do', 'is', 'the', 'a', 'an', 'in', 'of', 'and', 'to', 'for']);
const GUIDE_DISTINCT_MARKERS = [
  /\binterview\b/i,
  /\bsenior\b/i,
  /\bproduction\b/i,
  /\bpitfall\b/i,
  /\btrade[\s-]?offs?\b/i,
  /\bconstraint(?:s)?\b/i,
  /\banti[\s-]?patterns?\b/i,
  /\bdebug\b/i,
  /\binternals?\b/i,
  /\bunder\s+the\s+hood\b/i,
  /\bwhen\s+not\b/i,
  /\bvs\b/i,
  /\bcompare\b/i,
  /\bdecision(?:s)?\b/i,
  /\bchecklist\b/i,
  /\bframework\b/i,
  /\bplaybook\b/i,
  /\bworkflow\b/i,
  /\bperformance\b/i,
  /\bfailure(?:s)?\b/i,
];
const TRIVIA_DISTINCT_MARKERS = [
  /\bpitfall\b/i,
  /\btrade[\s-]?offs?\b/i,
  /\binterview\b/i,
  /\bproduction\b/i,
  /\bconstraint(?:s)?\b/i,
  /\bwrong\b/i,
  /\bcommon\s+mistake(?:s)?\b/i,
  /\bvs\b/i,
  /\binternally\b/i,
  /\bunder\s+the\s+hood\b/i,
  /\bwhen\s+not\b/i,
  /\bsenior\b/i,
  /\bdebug\b/i,
];
const SITE_TITLE_SUFFIX = ' | FrontendAtlas';
const DETAIL_TITLE_WARN_MAX = 70;
const DETAIL_TITLE_CORE_WARN_MAX = DETAIL_TITLE_WARN_MAX - SITE_TITLE_SUFFIX.length;
const TRIVIA_INTERVIEW_INTENT_MARKERS = [
  /\binterview(?:s)?\b/i,
  /\bprep(?:aration)?\b/i,
  /\bpractice\b/i,
  /\bcandidate(?:s)?\b/i,
  /\bround(?:s)?\b/i,
  /\bfollow[\s-]?ups?\b/i,
  /\bdrill(?:s)?\b/i,
  /\bquestion(?:s)?\b/i,
];
const TRIVIA_DOCS_INTENT_MARKERS = [
  /\bwhat\s+is\b/i,
  /\bhow\s+(?:does|do|to)\b/i,
  /\blearn\b/i,
  /\bguide\b/i,
  /\btutorial\b/i,
  /\bdocs?\b/i,
  /\bdocumentation\b/i,
  /\breference\b/i,
  /\bapi\s+reference\b/i,
  /\bdefinition\b/i,
];
const BROAD_TRIVIA_PREFIXES = ['what is', 'how does', 'how do', 'how to', 'why is', 'what does'];
const TRIVIA_DETAIL_TEMPLATE_PATH = path.resolve(
  process.env.TRIVIA_DETAIL_TEMPLATE_PATH
    || path.join(repoRoot, 'frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.html'),
);
const INTERVIEW_HUB_COMPONENT_PATH = path.resolve(
  process.env.INTERVIEW_HUB_COMPONENT_PATH
    || path.join(repoRoot, 'frontend/src/app/features/interview-questions/interview-questions-landing.component.ts'),
);
const HUB_PROFILE_MIN_TECH_TERMS = 4;
const HUB_PROFILE_MASTER_MIN_TECH_TERMS = 3;
const HUB_PROFILE_MAX_GENERIC_SENTENCE_RATIO = 0.35;
const HUB_PROFILE_MAX_DUPLICATE_SENTENCE_RATIO = 0.2;
const HUB_PROFILE_GENERIC_PATTERNS = [
  /\bstart\s+with\b/i,
  /\bopen\s+(?:the|a|one)?\b/i,
  /\bfollow\s+(?:the|a|one)?\b/i,
  /\buse\s+(?:this|these|the)\s+(?:hub|questions|concept questions|prep path|fundamentals guide)\b/i,
  /\bmove\s+into\b/i,
  /\breturn\s+to\s+(?:this|the)\s+hub\b/i,
  /\bbroader\s+coverage\b/i,
  /\bfull\s+librar(?:y|ies)\b/i,
  /\bguided\s+sequencing\b/i,
  /\bless\s+choice\s+load\b/i,
];
const HUB_PROFILE_TECH_TERMS = {
  master: [
    'frontend',
    'front end',
    'javascript',
    'ui',
    'browser',
    'framework',
    'state management',
    'system design',
    'coding',
    'concept recall',
  ],
  javascript: [
    'javascript',
    'execution order',
    'async',
    'closures',
    'prototypes',
    'arrays',
    'maps',
    'utility',
    'stale state',
    'race conditions',
    'equality',
    'coercion',
    'edge cases',
  ],
  react: [
    'react',
    'component state',
    'effects',
    'hooks',
    'stale closures',
    'refs',
    'context',
    'rendering',
    'memoization',
    'batching',
    'component splitting',
  ],
  angular: [
    'angular',
    'rxjs',
    'httpclient',
    'cancellation',
    'change detection',
    'dependency',
    'di scope',
    'standalone',
    'template binding',
    'forms',
    'testing',
  ],
  vue: [
    'vue',
    'reactivity',
    'refs',
    'computed',
    'watchers',
    'nexttick',
    'render timing',
    'props',
    'emits',
    'v-model',
    'provide',
    'inject',
    'keys',
  ],
  html: [
    'html',
    'semantic',
    'forms',
    'labels',
    'landmarks',
    'metadata',
    'responsive images',
    'accessibility',
    'browser defaults',
    'validation',
    'seo',
    'progressive enhancement',
  ],
  css: [
    'css',
    'layout',
    'selectors',
    'cascade',
    'specificity',
    'custom properties',
    'flexbox',
    'grid',
    'responsive',
    'overflow',
    'alignment',
    'stacking',
  ],
};

const errors = [];
const warnings = [];

function relFromRepo(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, '/');
}

function addError(message) {
  errors.push(message);
}

function addWarning(code, message) {
  warnings.push({ code, message });
}

function normalizeText(value) {
  return String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function meaningfulTokens(value) {
  return normalizeText(value)
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => token.length > 1)
    .filter((token) => !TECH_TOKENS.has(token))
    .filter((token) => !STOPWORDS.has(token));
}

function hasDistinctMarker(value, markers) {
  return markers.some((marker) => marker.test(String(value || '')));
}

function propertyNameToString(name) {
  if (!name) return '';
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return String(name.text || '');
  }
  return '';
}

function getObjectProperty(objectLiteral, propName) {
  return objectLiteral.properties.find((prop) => {
    if (!ts.isPropertyAssignment(prop)) return false;
    return propertyNameToString(prop.name) === propName;
  }) || null;
}

function readStringProperty(objectLiteral, propName) {
  const prop = getObjectProperty(objectLiteral, propName);
  if (!prop) return '';
  const init = prop.initializer;
  if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
    return init.text;
  }
  return '';
}

function readStringArrayProperty(objectLiteral, propName) {
  const prop = getObjectProperty(objectLiteral, propName);
  if (!prop || !ts.isArrayLiteralExpression(prop.initializer)) return [];

  return prop.initializer.elements
    .map((element) => {
      if (ts.isStringLiteral(element) || ts.isNoSubstitutionTemplateLiteral(element)) {
        return element.text;
      }
      return '';
    })
    .map((value) => String(value || '').trim())
    .filter(Boolean);
}

function readImportPath(entryObject) {
  const loadProp = getObjectProperty(entryObject, 'load');
  if (!loadProp) return '';
  let importPath = '';
  function visit(node) {
    if (
      ts.isCallExpression(node)
      && node.expression.kind === ts.SyntaxKind.ImportKeyword
      && node.arguments.length > 0
      && ts.isStringLiteral(node.arguments[0])
    ) {
      importPath = node.arguments[0].text;
    }
    node.forEachChild(visit);
  }
  loadProp.initializer.forEachChild(visit);
  return importPath;
}

function readObjectProperty(objectLiteral, propName) {
  const prop = getObjectProperty(objectLiteral, propName);
  if (!prop || !ts.isObjectLiteralExpression(prop.initializer)) return null;
  return prop.initializer;
}

function readGuideEntries() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    addError(`guide registry not found: ${relFromRepo(REGISTRY_PATH)}`);
    return [];
  }

  const source = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const sourceFile = ts.createSourceFile(
    REGISTRY_PATH,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  const arrays = new Map();
  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    node.declarationList.declarations.forEach((decl) => {
      if (!ts.isIdentifier(decl.name)) return;
      if (!GUIDE_COLLECTIONS.includes(decl.name.text)) return;
      if (decl.initializer && ts.isArrayLiteralExpression(decl.initializer)) {
        arrays.set(decl.name.text, decl.initializer);
      }
    });
  });

  if (!arrays.size) {
    addError(`guide registry could not be parsed into guide collections: ${relFromRepo(REGISTRY_PATH)}`);
    return [];
  }

  const entries = [];
  arrays.forEach((arrayLiteral, collection) => {
    arrayLiteral.elements.forEach((element) => {
      if (!ts.isObjectLiteralExpression(element)) return;
      const seo = readObjectProperty(element, 'seo');
      const importPath = readImportPath(element);
      const componentPath = importPath
        ? path.resolve(path.dirname(REGISTRY_PATH), `${importPath}.ts`)
        : '';

      if (!componentPath || !fs.existsSync(componentPath)) {
        addError(`${collection}:${readStringProperty(element, 'slug') || '<missing-slug>'} component file not found: ${componentPath ? relFromRepo(componentPath) : '(missing import path)'}`);
      }

      entries.push({
        collection,
        slug: readStringProperty(element, 'slug'),
        title: readStringProperty(element, 'title'),
        summary: readStringProperty(element, 'summary'),
        seo: {
          title: readStringProperty(seo || { properties: [] }, 'title'),
          description: readStringProperty(seo || { properties: [] }, 'description'),
          primaryKeyword: readStringProperty(seo || { properties: [] }, 'primaryKeyword'),
          draftSource: readStringProperty(seo || { properties: [] }, 'draftSource'),
          searchIntent: readStringProperty(seo || { properties: [] }, 'searchIntent'),
          readerPromise: readStringProperty(seo || { properties: [] }, 'readerPromise'),
          uniqueAngle: readStringProperty(seo || { properties: [] }, 'uniqueAngle'),
        },
        componentPath,
      });
    });
  });

  return entries;
}

function parseJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    addError(`${relFromRepo(filePath)} could not be parsed: ${error.message}`);
    return null;
  }
}

function listTriviaFiles(rootDir) {
  if (!fs.existsSync(rootDir)) {
    addError(`questions directory not found: ${relFromRepo(rootDir)}`);
    return [];
  }

  return fs.readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(rootDir, entry.name, 'trivia.json'))
    .filter((filePath) => fs.existsSync(filePath));
}

function collectTextFromTriviaEntry(entry) {
  const parts = [entry.title, entry.description, entry.seo?.title, entry.seo?.description];
  const answer = entry.answer;

  if (typeof answer === 'string') {
    parts.push(answer);
  } else if (answer && typeof answer === 'object' && Array.isArray(answer.blocks)) {
    answer.blocks.forEach((block) => {
      if (!block || typeof block !== 'object') return;
      if (block.type === 'text') parts.push(block.text);
      if (block.type === 'list') {
        parts.push(block.caption);
        if (Array.isArray(block.columns)) parts.push(...block.columns);
        if (Array.isArray(block.rows)) {
          block.rows.forEach((row) => {
            if (Array.isArray(row)) parts.push(...row);
          });
        }
      }
      if (block.type === 'image') parts.push(block.caption);
    });
  }

  return parts.join(' ');
}

function jaccardSimilarity(leftTokens, rightTokens) {
  const left = new Set(leftTokens);
  const right = new Set(rightTokens);
  const union = new Set([...left, ...right]);
  if (!union.size) return 0;
  let intersection = 0;
  left.forEach((token) => {
    if (right.has(token)) intersection += 1;
  });
  return intersection / union.size;
}

function guideSuppressed(entry) {
  return Boolean(
    String(entry.seo.uniqueAngle || '').trim()
    && (
      String(entry.seo.draftSource || '').trim()
      || String(entry.seo.searchIntent || '').trim()
      || String(entry.seo.readerPromise || '').trim()
    ),
  );
}

function validateGuides(entries) {
  const byComponent = new Map();

  entries.forEach((entry) => {
    const id = `${entry.collection}:${entry.slug}`;
    const distinctText = [entry.title, entry.summary, entry.seo.description].join(' ');
    const hasDistinct = hasDistinctMarker(distinctText, GUIDE_DISTINCT_MARKERS);
    const suppressed = guideSuppressed(entry);
    const keywordTokens = meaningfulTokens(entry.seo.primaryKeyword);
    const titleTokens = meaningfulTokens(entry.seo.title || entry.title);
    const broadTitle = titleTokens.length > 0 && titleTokens.length <= 4;
    const genericCandidate = (keywordTokens.length > 0 && keywordTokens.length <= 4) || broadTitle;

    if (entry.componentPath) {
      const list = byComponent.get(entry.componentPath) || [];
      list.push(id);
      byComponent.set(entry.componentPath, list);
    }

    if (!suppressed && genericCandidate && !hasDistinct) {
      addWarning('generic-query-risk', `${id} has a short/head-term metadata shape (${entry.seo.primaryKeyword || entry.seo.title || entry.title}) without a stronger distinct-angle signal`);
    }
    if (!suppressed && !hasDistinct) {
      addWarning('weak-distinct-angle', `${id} metadata does not surface a clear competitive angle; add interview/production/tradeoff/debug-specific framing`);
    }
  });

  byComponent.forEach((ids, componentPath) => {
    if (ids.length < 2) return;
    ids.forEach((id) => {
      addWarning('shared-guide-component', `${id} shares ${relFromRepo(componentPath)} with ${ids.filter((candidate) => candidate !== id).join(', ')}`);
    });
  });
}

function validateTrivia(entriesByTech) {
  entriesByTech.forEach(({ tech, entries }) => {
    entries.forEach((entry) => {
      const id = `${tech}:${String(entry?.id || '').trim() || '<missing-id>'}`;
      const title = String(entry?.seo?.title || entry?.title || '').trim();
      const description = String(entry?.seo?.description || entry?.description || '').trim();
      const broadTitle = normalizeText(title);
      const metadataText = [entry?.title, entry?.description, entry?.seo?.title, entry?.seo?.description].join(' ');
      const combinedText = collectTextFromTriviaEntry(entry);
      const metadataHasDistinct = hasDistinctMarker(metadataText, TRIVIA_DISTINCT_MARKERS);
      const combinedHasDistinct = hasDistinctMarker(combinedText, TRIVIA_DISTINCT_MARKERS);
      const metadataHasInterviewIntent = hasDistinctMarker(metadataText, TRIVIA_INTERVIEW_INTENT_MARKERS);
      const titleHasDocsIntent = hasDistinctMarker(title, TRIVIA_DOCS_INTENT_MARKERS);
      const titleWithBrandLength = `${title}${SITE_TITLE_SUFFIX}`.length;
      const titleTokens = meaningfulTokens(title);
      const genericCandidate = BROAD_TRIVIA_PREFIXES.some((prefix) => broadTitle.startsWith(prefix))
        || (titleTokens.length > 0 && titleTokens.length <= 4);

      if (title && titleWithBrandLength > DETAIL_TITLE_WARN_MAX) {
        addWarning(
          'detail-serp-title-too-long',
          `${id} seo title is ${titleWithBrandLength} chars with brand suffix; keep the core title near ${DETAIL_TITLE_CORE_WARN_MAX} chars or expect Google rewrites (${title})`,
        );
      }
      if (!metadataHasInterviewIntent) {
        addWarning(
          'missing-interview-intent',
          `${id} metadata does not clearly surface interview/practice intent; title="${title || '<missing-title>'}" description="${description || '<missing-description>'}"`,
        );
      }
      if (titleHasDocsIntent && !metadataHasInterviewIntent) {
        addWarning(
          'docs-intent-collision',
          `${id} title looks docs/reference-oriented without an interview intent counterweight (${title || '<missing-title>'})`,
        );
      }
      if (genericCandidate && !metadataHasDistinct) {
        addWarning('generic-query-risk', `${id} looks like a broad commodity query (${title || entry?.title || '<missing-title>'}) without a stronger beyond-basics signal`);
      }
      if (!combinedHasDistinct) {
        addWarning('weak-distinct-angle', `${id} does not surface a clear beyond-basics angle in metadata/answer text; add production, pitfall, debug, or interview-specific framing`);
      }
    });

    for (let index = 0; index < entries.length; index += 1) {
      for (let cursor = index + 1; cursor < entries.length; cursor += 1) {
        const left = entries[index];
        const right = entries[cursor];
        const leftText = `${left?.seo?.title || left?.title || ''} ${left?.description || ''}`;
        const rightText = `${right?.seo?.title || right?.title || ''} ${right?.description || ''}`;
        const leftNormalized = meaningfulTokens(leftText).join(' ');
        const rightNormalized = meaningfulTokens(rightText).join(' ');
        if (!leftNormalized || !rightNormalized || leftNormalized === rightNormalized) continue;
        const similarity = jaccardSimilarity(leftNormalized.split(/\s+/), rightNormalized.split(/\s+/));
        if (similarity >= 0.72) {
          addWarning(
            'near-duplicate-trivia',
            `${tech}:${left.id} and ${tech}:${right.id} have highly overlapping search framing (${similarity.toFixed(2)} Jaccard on normalized seo.title + description)`,
          );
        }
      }
    }
  });
}

function readTriviaEntries() {
  const triviaFiles = listTriviaFiles(QUESTIONS_DIR);
  const entriesByTech = [];

  triviaFiles.forEach((filePath) => {
    const tech = path.basename(path.dirname(filePath));
    const parsed = parseJson(filePath);
    if (!Array.isArray(parsed)) {
      addError(`${relFromRepo(filePath)} must export an array of trivia entries`);
      return;
    }
    entriesByTech.push({ tech, entries: parsed });
  });

  return entriesByTech;
}

function validateTriviaTemplateAnchors() {
  if (!fs.existsSync(TRIVIA_DETAIL_TEMPLATE_PATH)) return;
  const source = fs.readFileSync(TRIVIA_DETAIL_TEMPLATE_PATH, 'utf8');
  const genericAnchors = [
    /Browse related concept questions/i,
    /Browse concept questions in Question Library/i,
    /Practice from Question Library/i,
  ];

  genericAnchors.forEach((pattern) => {
    if (!pattern.test(source)) return;
    addWarning(
      'generic-trivia-bridge-anchor',
      `${relFromRepo(TRIVIA_DETAIL_TEMPLATE_PATH)} still contains generic detail-to-hub anchor text matching ${pattern}`,
    );
  });
}

function readHubIntentProfiles() {
  if (!fs.existsSync(INTERVIEW_HUB_COMPONENT_PATH)) {
    addWarning('hub-profile-source-missing', `interview hub component not found: ${relFromRepo(INTERVIEW_HUB_COMPONENT_PATH)}`);
    return [];
  }

  const source = fs.readFileSync(INTERVIEW_HUB_COMPONENT_PATH, 'utf8');
  const sourceFile = ts.createSourceFile(
    INTERVIEW_HUB_COMPONENT_PATH,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  let profileObject = null;

  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    node.declarationList.declarations.forEach((decl) => {
      if (!ts.isIdentifier(decl.name) || decl.name.text !== 'HUB_INTENT_PROFILES') return;
      if (decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) {
        profileObject = decl.initializer;
      }
    });
  });

  if (!profileObject) {
    addWarning('hub-profile-source-missing', `${relFromRepo(INTERVIEW_HUB_COMPONENT_PATH)} does not expose a parseable HUB_INTENT_PROFILES object`);
    return [];
  }

  const profiles = [];
  profileObject.properties.forEach((prop) => {
    if (!ts.isPropertyAssignment(prop) || !ts.isObjectLiteralExpression(prop.initializer)) return;
    const key = propertyNameToString(prop.name);
    if (!key) return;
    const relatedPrep = readObjectProperty(prop.initializer, 'relatedPrep') || { properties: [] };
    profiles.push({
      key,
      heading: readStringProperty(prop.initializer, 'heading'),
      lead: readStringProperty(prop.initializer, 'lead'),
      tests: readStringArrayProperty(prop.initializer, 'tests'),
      usage: readStringArrayProperty(prop.initializer, 'usage'),
      credibility: readStringProperty(prop.initializer, 'credibility'),
      relatedPrep: {
        label: readStringProperty(relatedPrep, 'label'),
        summary: readStringProperty(relatedPrep, 'summary'),
      },
    });
  });

  return profiles;
}

function profileTextParts(profile) {
  return [
    profile.heading,
    profile.lead,
    ...profile.tests,
    ...profile.usage,
    profile.credibility,
    profile.relatedPrep?.label,
    profile.relatedPrep?.summary,
  ].map((part) => String(part || '').trim()).filter(Boolean);
}

function splitHubSentences(parts) {
  return parts
    .flatMap((part) => String(part || '').split(/(?<=[.!?])\s+/))
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter((part) => meaningfulTokens(part).length >= 4);
}

function hubTermsForProfile(key) {
  return HUB_PROFILE_TECH_TERMS[key] || [];
}

function matchedHubTerms(key, value) {
  const normalized = normalizeText(value);
  if (!normalized) return [];
  return hubTermsForProfile(key)
    .map((term) => normalizeText(term))
    .filter(Boolean)
    .filter((term) => normalized.includes(term));
}

function hasHubSpecificTerm(key, value) {
  return matchedHubTerms(key, value).length > 0;
}

function isGenericHubSentence(sentence) {
  return HUB_PROFILE_GENERIC_PATTERNS.some((pattern) => pattern.test(sentence));
}

function normalizeHubSentenceForDupes(sentence) {
  return normalizeText(sentence)
    .replace(/\b(frontend|front end|javascript|typescript|react|angular|vue|html|css)\b/g, '<tech>')
    .replace(/\s+/g, ' ')
    .trim();
}

function validateHubIntentProfiles(profiles) {
  if (!profiles.length) return;

  const profileSentences = profiles.map((profile) => ({
    profile,
    sentences: splitHubSentences(profileTextParts(profile)),
  }));
  const sentenceCounts = new Map();

  profileSentences.forEach(({ sentences }) => {
    sentences.forEach((sentence) => {
      const normalized = normalizeHubSentenceForDupes(sentence);
      if (!normalized || meaningfulTokens(normalized).length < 5) return;
      sentenceCounts.set(normalized, (sentenceCounts.get(normalized) || 0) + 1);
    });
  });

  profileSentences.forEach(({ profile, sentences }) => {
    const id = `hub:${profile.key}`;
    const combinedText = profileTextParts(profile).join(' ');
    const specificTerms = new Set(matchedHubTerms(profile.key, combinedText));
    const requiredTermCount = profile.key === 'master'
      ? HUB_PROFILE_MASTER_MIN_TECH_TERMS
      : HUB_PROFILE_MIN_TECH_TERMS;
    const genericSentences = sentences.filter((sentence) =>
      isGenericHubSentence(sentence) && !hasHubSpecificTerm(profile.key, sentence)
    );
    const duplicateSentences = sentences.filter((sentence) => {
      const normalized = normalizeHubSentenceForDupes(sentence);
      return normalized && (sentenceCounts.get(normalized) || 0) > 1;
    });
    const genericRatio = sentences.length ? genericSentences.length / sentences.length : 0;
    const duplicateRatio = sentences.length ? duplicateSentences.length / sentences.length : 0;

    if (specificTerms.size < requiredTermCount) {
      addWarning(
        'hub-profile-low-specificity',
        `${id} has ${specificTerms.size} tech-specific term(s); expected at least ${requiredTermCount}. Add concrete interview surface terms instead of generic prep copy.`,
      );
    }
    if (genericSentences.length >= 2 && genericRatio > HUB_PROFILE_MAX_GENERIC_SENTENCE_RATIO) {
      addWarning(
        'hub-profile-generic-phrase-ratio',
        `${id} has ${(genericRatio * 100).toFixed(0)}% generic guidance sentences without profile-specific terms: ${genericSentences.slice(0, 2).join(' | ')}`,
      );
    }
    if (duplicateSentences.length >= 2 && duplicateRatio > HUB_PROFILE_MAX_DUPLICATE_SENTENCE_RATIO) {
      addWarning(
        'hub-profile-duplicate-sentence-ratio',
        `${id} has ${(duplicateRatio * 100).toFixed(0)}% duplicate/template-like sentences across hub profiles: ${duplicateSentences.slice(0, 2).join(' | ')}`,
      );
    }
  });
}

function main() {
  const guides = readGuideEntries();
  const trivia = readTriviaEntries();
  const hubProfiles = readHubIntentProfiles();

  if (!errors.length) {
    validateGuides(guides);
    validateTrivia(trivia);
    validateTriviaTemplateAnchors();
    validateHubIntentProfiles(hubProfiles);
  }

  warnings.forEach(({ code, message }) => console.warn(`[lint-indexability-readiness] WARN [${code}] ${message}`));
  errors.forEach((message) => console.error(`[lint-indexability-readiness] ${message}`));

  if (errors.length) {
    console.error(`[lint-indexability-readiness] failed with ${errors.length} error(s).`);
    process.exit(1);
  }

  const triviaCount = trivia.reduce((sum, item) => sum + item.entries.length, 0);
  console.log(`[lint-indexability-readiness] indexability readiness scan completed (${guides.length} guide(s), ${triviaCount} trivia entries, ${hubProfiles.length} hub profile(s), ${warnings.length} warning(s)).`);
}

main();
