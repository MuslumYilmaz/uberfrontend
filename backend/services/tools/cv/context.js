'use strict';

const { normalizeRoleId } = require('./keyword-packs');
const { analyzeExtractionQuality } = require('./linter/analyzers/extraction-quality');
const { computeKeywordCoverage } = require('./linter/analyzers/keywords');

const SECTION_HEADING_MAP = Object.freeze({
  experience: [
    /^(professional\s+)?experience:?$/i,
    /^work(\s+experience)?[:]?$/i,
    /^employment(\s+history)?[:]?$/i,
    /^career(\s+history)?[:]?$/i,
  ],
  education: [
    /^education:?$/i,
    /^academic(\s+background)?[:]?$/i,
    /^certifications?[:]?$/i,
  ],
  skills: [
    /^skills:?$/i,
    /^technical skills:?$/i,
    /^core skills:?$/i,
    /^tech stack:?$/i,
    /^technologies:?$/i,
    /^core competencies:?$/i,
  ],
  projects: [
    /^projects?[:]?$/i,
    /^selected projects?[:]?$/i,
    /^project highlights:?$/i,
  ],
  summary: [
    /^summary:?$/i,
    /^profile:?$/i,
    /^about:?$/i,
    /^professional summary:?$/i,
    /^objective:?$/i,
  ],
});

const SKILLS_LABEL_ALIAS_RE = /^(languages?|technologies|frameworks?|tools?)\s*:\s*\S+/i;
const CONTACT_LINE_RE = /\b(?:@|linkedin\.com|github\.com|https?:\/\/|\+?\d[\d().\s-]{6,})\b/i;

const ROLE_HINT_RE = /\b(front[-\s]?end|frontend|ui|javascript|typescript|angular|react|vue|engineer|developer|architect)\b/i;
const SPECIALIZATION_HINT_RE = /\b(performance|accessibility|scalab(?:le|ility)|architecture|design systems?|state management|testing|web)\b/i;
const YEARS_HINT_RE = /\b\d+\+?\s*(?:years?|yrs?)\b/i;
const SENIORITY_HINT_RE = /\b(senior|lead|principal|staff)\b/i;

const ACTION_VERBS = new Set([
  'built', 'implemented', 'designed', 'developed', 'created', 'led', 'optimized', 'improved',
  'reduced', 'increased', 'launched', 'delivered', 'automated', 'integrated', 'migrated',
  'refactored', 'architected', 'deployed', 'scaled', 'secured', 'enhanced', 'debugged',
  'streamlined', 'orchestrated', 'drove', 'spearheaded', 'initiated', 'boosted', 'cut',
  'owned', 'collaborated', 'mentored', 'introduced', 'monitored', 'analyzed', 'standardized',
  'shipped', 'stabilized', 'prevented', 'accelerated',
]);

const OUTCOME_TERMS = [
  'improved', 'reduced', 'increased', 'accelerated', 'shipped', 'delivered', 'stabilized',
  'prevented', 'automated', 'optimized', 'cut', 'boosted', 'grew', 'led', 'owned', 'migrated',
  'standardized', 'streamlined', 'refactored',
];

const SCOPE_TERMS = [
  'users', 'customers', 'requests', 'events', 'sessions', 'components', 'features',
  'platform', 'team', 'services', 'applications', 'traffic', 'revenue', 'tenants',
];

const BULLET_START_RE = /^([•●◦▪‣\-*]|\d+[.)])\s+(.+)$/;
const BULLET_TOKEN_GLOBAL_RE = /(?:^|\s)([•●◦▪‣]|\d+[.)]|[-*])\s+/g;
const MIDLINE_BULLET_SYMBOL_RE = /.+\s[•●◦▪‣]\s+\S/;

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}\b/;
const LINKEDIN_RE = /\blinkedin\.com\/[^\s)]+/i;

const DATE_PATTERN_MAP = Object.freeze({
  'MMM YYYY': /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[\s.-]+(?:19|20)\d{2}\b/i,
  'Month YYYY': /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)[\s.-]+(?:19|20)\d{2}\b/i,
  'MM/YYYY': /\b(?:0?[1-9]|1[0-2])[\/-](?:19|20)\d{2}\b/,
  YYYY: /\b(?:19|20)\d{2}\b/,
});
const DATE_FORMAT_ORDER = ['MMM YYYY', 'Month YYYY', 'MM/YYYY', 'YYYY'];
const DATE_FORMAT_RECOMMENDED = 'MMM YYYY';

const METRIC_PATTERNS = [
  /(?:^|\D)\d+(?:\.\d+)?\s*%/,
  /\b\d+(?:\.\d+)?\s*(?:ms|s|sec|secs|seconds|min|mins|minutes)\b/i,
  /[$€£₺]\s?\d+(?:\.\d+)?\s*(?:k|m|b)?\b/i,
  /\b\d+(?:\.\d+)?\s*(?:k|m|b)\b/i,
  /\b\d+(?:\.\d+)?x\b/i,
  /\b(?:reduced|increased|cut|improved|boosted|grew)\s+by\s+\d+(?:\.\d+)?%?\b/i,
  /\bfrom\s+\d+(?:\.\d+)?\s*(?:ms|s|sec|secs|seconds|%|k|m|b)?\s+to\s+\d+(?:\.\d+)?\s*(?:ms|s|sec|secs|seconds|%|k|m|b)?\b/i,
];

const RESPONSIBLE_FOR_RE = /^responsible\s+for\b/i;
const STACK_WINDOW_LINES = 8;
const STACK_EXCEPTION_PATTERNS = [
  /angular\s+frontend\s*(?:and|\+)\s*node\s+backend/i,
  /react(?:\s+app)?\s+(?:embedded|inside)\s+in\s+angular\s+shell/i,
  /migrated\s+from\s+react\s+to\s+angular/i,
  /\bfrontend\b[\s\w,-]{0,30}\bbackend\b/i,
  /\bbackend\b[\s\w,-]{0,30}\bfrontend\b/i,
];
const STACK_RULES = [
  {
    id: 'mern_vs_angular',
    leftLabel: 'MERN',
    rightLabel: 'Angular',
    left: /\bmern\b/i,
    right: /\bangular\b/i,
  },
  {
    id: 'mean_vs_react',
    leftLabel: 'MEAN',
    rightLabel: 'React',
    left: /\bmean\b/i,
    right: /\breact\b/i,
  },
  {
    id: 'next_vs_angular_universal',
    leftLabel: 'Next.js',
    rightLabel: 'Angular Universal',
    left: /\bnext(?:\.js)?\b/i,
    right: /\bangular\s+universal\b/i,
  },
];

function normalizeCvText(rawText) {
  return String(rawText || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function detectSectionHeading(line) {
  const trimmed = String(line || '').trim();
  if (!trimmed || trimmed.length > 72) return null;

  for (const [section, patterns] of Object.entries(SECTION_HEADING_MAP)) {
    if (patterns.some((regex) => regex.test(trimmed))) return section;
  }
  return null;
}

function firstWord(value) {
  return String(value || '')
    .trim()
    .replace(/^[^A-Za-z]+/, '')
    .split(/\s+/)[0]
    ?.toLowerCase()
    .replace(/[^a-z]/g, '') || '';
}

function isCapsHeavyLine(line) {
  const letters = String(line || '').replace(/[^A-Za-z]/g, '');
  if (letters.length < 10) return false;
  const upper = letters.replace(/[^A-Z]/g, '').length;
  return upper / letters.length > 0.85;
}

function countSpacingIssues(rawText) {
  const matches = String(rawText || '').match(/ {2,}|\t/g);
  return matches ? matches.length : 0;
}

function ensureSectionMap() {
  return {
    experience: [],
    education: [],
    skills: [],
    projects: [],
    summary: [],
    other: [],
  };
}

function mergeUnique(values) {
  const seen = new Set();
  const out = [];
  for (const value of values || []) {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function detectSkillsAlias(lineEntries, maxLines) {
  const topLines = (lineEntries || []).filter((entry) => entry.rank <= maxLines);
  const hits = topLines.filter((entry) => SKILLS_LABEL_ALIAS_RE.test(entry.text));
  return {
    found: hits.length > 0,
    aliasType: hits.length ? 'labeled_block' : null,
    lines: hits.slice(0, 3).map((entry) => ({
      lineNumber: entry.lineNumber,
      text: entry.text,
      reason: 'skills alias label',
    })),
  };
}

function detectSummaryAlias(lineEntries, maxLines) {
  const topLines = (lineEntries || [])
    .filter((entry) => entry.rank <= maxLines)
    .filter((entry) => !CONTACT_LINE_RE.test(entry.text))
    .filter((entry) => !SKILLS_LABEL_ALIAS_RE.test(entry.text));

  // Heuristic note: this intentionally favors precision, so some concise summaries can be missed.
  const introLines = topLines.slice(0, 4);
  const introText = introLines.map((line) => line.text).join(' ').trim();
  if (!introText) return { found: false, aliasType: null, lines: [] };

  const words = introText.split(/\s+/).filter(Boolean);
  const sentenceCountRaw = introText
    .split(/[.!?]+/)
    .map((line) => line.trim())
    .filter(Boolean).length;
  const sentenceCount = sentenceCountRaw || introLines.length;

  const likelyIntro = words.length >= 16
    && words.length <= 110
    && sentenceCount >= 1
    && sentenceCount <= 4
    && ROLE_HINT_RE.test(introText)
    && SPECIALIZATION_HINT_RE.test(introText)
    && (YEARS_HINT_RE.test(introText) || SENIORITY_HINT_RE.test(introText));

  return {
    found: likelyIntro,
    aliasType: likelyIntro ? 'intro_paragraph' : null,
    lines: likelyIntro
      ? introLines.slice(0, 3).map((entry) => ({
        lineNumber: entry.lineNumber,
        text: entry.text,
        reason: 'summary intro heuristic',
      }))
      : [],
  };
}

function normalizeBulletMarker(rawToken) {
  if (/\d+[.)]/.test(rawToken)) return 'numbered';
  if (rawToken === '-' || rawToken === '*' || rawToken === '•' || rawToken === '●' || rawToken === '◦' || rawToken === '▪' || rawToken === '‣') {
    return rawToken;
  }
  return 'symbol';
}

function hasMetricToken(content) {
  return METRIC_PATTERNS.some((regex) => regex.test(content)) || /\d/.test(content);
}

function hasOutcomeLanguage(content) {
  return OUTCOME_TERMS.some((item) => new RegExp(`\\b${item}\\b`, 'i').test(content));
}

function hasScopeLanguage(content) {
  return SCOPE_TERMS.some((item) => new RegExp(`\\b${item}\\b`, 'i').test(content));
}

function buildBulletMeta(content) {
  const words = String(content || '').split(/\s+/).filter(Boolean);
  const first = firstWord(content);
  const hasMetric = hasMetricToken(content);
  const hasOutcomeVerb = hasOutcomeLanguage(content);
  return {
    wordCount: words.length,
    hasMetric,
    startsWithResponsible: RESPONSIBLE_FOR_RE.test(content),
    startsWithActionVerb: ACTION_VERBS.has(first),
    hasOutcomeLanguage: hasOutcomeVerb,
    hasOutcomeEvidence: hasMetric || hasOutcomeVerb,
    hasScopeLanguage: hasScopeLanguage(content),
    hasTrailingPunctuation: /[.!?]$/.test(content),
  };
}

function extractBulletSegments(line) {
  const segments = [];
  BULLET_TOKEN_GLOBAL_RE.lastIndex = 0;
  let match = BULLET_TOKEN_GLOBAL_RE.exec(line);
  const matches = [];

  while (match) {
    const tokenOffset = match.index + (match[0].length - match[1].length - 1);
    matches.push({
      token: match[1],
      tokenOffset: Math.max(0, tokenOffset),
      contentStart: BULLET_TOKEN_GLOBAL_RE.lastIndex,
    });
    match = BULLET_TOKEN_GLOBAL_RE.exec(line);
  }

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const next = matches[index + 1];
    const end = next ? next.tokenOffset : line.length;
    const content = line.slice(current.contentStart, end).trim();
    if (!content) continue;
    segments.push({
      token: current.token,
      tokenOffset: current.tokenOffset,
      content,
    });
  }
  return segments;
}

function detectDateFormats(line) {
  const used = [];
  for (const format of DATE_FORMAT_ORDER) {
    const regex = DATE_PATTERN_MAP[format];
    if (regex.test(line)) used.push(format);
  }
  if (used.includes('MMM YYYY') || used.includes('Month YYYY') || used.includes('MM/YYYY')) {
    return used.filter((format) => format !== 'YYYY');
  }
  return used;
}

function assignRegion(section, line, rank) {
  if (section === 'experience' || section === 'projects') return 'experience';
  if (section === 'skills') return 'skills';
  if (rank <= 20 && SKILLS_LABEL_ALIAS_RE.test(line)) return 'skills';
  return 'other';
}

function buildStackContradictions(lineEntries) {
  const scopedLines = (lineEntries || []).filter((entry) => entry.region === 'experience');
  const byBlock = new Map();
  for (const entry of scopedLines) {
    const key = entry.blockKey || 'other:0';
    if (!byBlock.has(key)) byBlock.set(key, []);
    byBlock.get(key).push(entry);
  }

  const contradictions = [];
  const dedupe = new Set();

  // Heuristic note: line-window matching can still miss clarifiers that are far apart.
  for (const [blockKey, blockLines] of byBlock.entries()) {
    for (let i = 0; i < blockLines.length; i += 1) {
      const base = blockLines[i];
      for (const rule of STACK_RULES) {
        if (!rule.left.test(base.text) && !rule.right.test(base.text)) continue;

        const upperIndex = Math.min(blockLines.length - 1, i + STACK_WINDOW_LINES);
        for (let j = i; j <= upperIndex; j += 1) {
          const windowLines = blockLines.slice(i, j + 1);
          const windowText = windowLines.map((line) => line.text).join(' ');
          if (!rule.left.test(windowText) || !rule.right.test(windowText)) continue;
          if (STACK_EXCEPTION_PATTERNS.some((regex) => regex.test(windowText))) continue;

          const lineStart = windowLines[0].lineNumber;
          const lineEnd = windowLines[windowLines.length - 1].lineNumber;
          const dedupeKey = `${blockKey}:${rule.id}:${lineStart}:${lineEnd}`;
          if (dedupe.has(dedupeKey)) continue;
          dedupe.add(dedupeKey);

          contradictions.push({
            id: rule.id,
            left: rule.leftLabel,
            right: rule.rightLabel,
            lineStart,
            lineEnd,
            snippet: windowText,
            reason: `matched ${rule.leftLabel} + ${rule.rightLabel} within ${windowLines.length} lines`,
          });
          break;
        }
      }
    }
  }

  return contradictions;
}

function buildCvContext(rawText, options = {}) {
  const roleId = normalizeRoleId(options.roleId);
  const normalizedText = normalizeCvText(rawText);
  const lines = normalizedText ? normalizedText.split('\n') : [];
  const sectionLines = ensureSectionMap();
  const sectionsPresent = {
    experience: false,
    education: false,
    skills: false,
    projects: false,
    summary: false,
  };
  const explicitSectionHeadings = {
    experience: false,
    education: false,
    skills: false,
    projects: false,
    summary: false,
  };

  let currentSection = 'other';
  const sectionBlockCounter = {
    experience: 0,
    education: 0,
    skills: 0,
    projects: 0,
    summary: 0,
    other: 0,
  };
  let rankedNonEmpty = 0;
  let longLineCount = 0;
  let capsHeavyLineCount = 0;
  let duplicateLineCount = 0;

  const lineEntries = [];
  const lineOccurrences = new Map();
  const bulletMarkers = new Set();
  const bulletStarts = new Map();
  const bulletLines = [];
  const mergedBulletLines = [];
  const dateFormatEvidence = {
    'MMM YYYY': [],
    'Month YYYY': [],
    'MM/YYYY': [],
    YYYY: [],
  };

  for (let index = 0; index < lines.length; index += 1) {
    const source = lines[index];
    const line = String(source || '').trim();
    if (!line) continue;
    rankedNonEmpty += 1;

    const heading = detectSectionHeading(line);
    const lineNumber = index + 1;
    if (heading) {
      explicitSectionHeadings[heading] = true;
      sectionsPresent[heading] = true;
      currentSection = heading;
      sectionBlockCounter[heading] += 1;
      lineEntries.push({
        rank: rankedNonEmpty,
        lineNumber,
        text: line,
        section: heading,
        region: 'header',
        blockKey: `${heading}:${sectionBlockCounter[heading]}`,
        isHeading: true,
      });
      continue;
    }

    const region = assignRegion(currentSection, line, rankedNonEmpty);
    const blockKey = `${currentSection}:${sectionBlockCounter[currentSection] || 0}`;
    const lineEntry = {
      rank: rankedNonEmpty,
      lineNumber,
      text: line,
      section: currentSection,
      region,
      blockKey,
      isHeading: false,
    };
    lineEntries.push(lineEntry);
    sectionLines[currentSection].push(line);

    if (line.length > 130) longLineCount += 1;
    if (isCapsHeavyLine(line)) capsHeavyLineCount += 1;

    const duplicateKey = line.toLowerCase();
    const seen = lineOccurrences.get(duplicateKey) || 0;
    lineOccurrences.set(duplicateKey, seen + 1);
    if (seen >= 1 && line.length >= 16) duplicateLineCount += 1;

    const formatsInLine = detectDateFormats(line);
    for (const format of formatsInLine) {
      if (dateFormatEvidence[format].length < 3) {
        dateFormatEvidence[format].push({
          lineNumber,
          text: line,
        });
      }
    }

    const startBulletMatch = line.match(BULLET_START_RE);
    const extractedSegments = extractBulletSegments(line);
    const hasMidlineBullet = MIDLINE_BULLET_SYMBOL_RE.test(line);
    const hasMultipleTokens = extractedSegments.length > 1;

    if (startBulletMatch && extractedSegments.length <= 1) {
      const marker = normalizeBulletMarker(startBulletMatch[1]);
      const content = startBulletMatch[2].trim();
      const meta = buildBulletMeta(content);
      bulletMarkers.add(marker);
      const first = firstWord(content);
      bulletStarts.set(first, (bulletStarts.get(first) || 0) + 1);
      bulletLines.push({
        section: currentSection,
        region,
        lineNumber,
        sourceLine: line,
        line: content,
        marker,
        ...meta,
      });
      continue;
    }

    if (!extractedSegments.length) continue;

    if (hasMidlineBullet || hasMultipleTokens || extractedSegments.some((segment) => segment.tokenOffset > 0)) {
      mergedBulletLines.push({
        lineNumber,
        text: line,
        reason: hasMultipleTokens ? 'multiple bullet tokens on one line' : 'bullet token found in mid-line',
      });
    }

    for (const segment of extractedSegments) {
      const marker = normalizeBulletMarker(segment.token);
      const content = segment.content.trim();
      if (!content) continue;
      const meta = buildBulletMeta(content);
      bulletMarkers.add(marker);
      const first = firstWord(content);
      bulletStarts.set(first, (bulletStarts.get(first) || 0) + 1);
      bulletLines.push({
        section: currentSection,
        region,
        lineNumber,
        sourceLine: line,
        line: content,
        marker,
        mergedFromLine: true,
        ...meta,
      });
    }
  }

  const skillsAlias = detectSkillsAlias(lineEntries, 20);
  const summaryAlias = detectSummaryAlias(lineEntries, 12);
  const skillsImplicitlyDetected = !explicitSectionHeadings.skills && skillsAlias.found;
  const summaryImplicitlyDetected = !explicitSectionHeadings.summary && summaryAlias.found;
  if (skillsImplicitlyDetected) sectionsPresent.skills = true;
  if (summaryImplicitlyDetected) sectionsPresent.summary = true;

  const bulletCount = bulletLines.length;
  const bulletsWithMetrics = bulletLines.filter((item) => item.hasMetric).length;
  const experienceBullets = bulletLines.filter((item) => item.region === 'experience');
  const experienceBulletsWithNumbers = experienceBullets.filter((item) => item.hasMetric).length;
  const responsibleForCount = bulletLines.filter((item) => item.startsWithResponsible).length;
  const weakActionVerbCount = bulletLines.filter((item) => !item.startsWithActionVerb).length;
  const outcomeLanguageCount = bulletLines.filter((item) => item.hasOutcomeLanguage).length;
  const outcomeEvidenceCount = experienceBullets.filter((item) => item.hasOutcomeEvidence).length;
  const scopeLanguageCount = bulletLines.filter((item) => item.hasScopeLanguage).length;
  const shortBulletCount = bulletLines.filter((item) => item.wordCount < 8).length;
  const punctuatedBulletCount = bulletLines.filter((item) => item.hasTrailingPunctuation).length;

  const maxBulletStartCount = Math.max(0, ...Array.from(bulletStarts.values()));
  const repeatedBulletStartRatio = bulletCount ? maxBulletStartCount / bulletCount : 0;
  const mixedBulletMarkers = bulletMarkers.size > 1;
  const trailingPunctuationMixed = punctuatedBulletCount > 0 && punctuatedBulletCount < bulletCount;
  const bulletsWithoutOutcome = experienceBullets.filter((bullet) => !bullet.hasOutcomeEvidence);

  const dateFormatsUsedList = DATE_FORMAT_ORDER.filter((format) => dateFormatEvidence[format].length > 0);
  const dateFormatsUsed = dateFormatsUsedList.length;

  const specialCharMatches = normalizedText.match(/[^\w\s.,;:()\-+/%$€£₺]/g);
  const specialCharCount = specialCharMatches ? specialCharMatches.length : 0;
  const specialCharRatio = normalizedText.length ? specialCharCount / normalizedText.length : 0;

  const skillsCoverageLines = mergeUnique([
    ...sectionLines.skills,
    ...(skillsAlias.lines || []).map((line) => line.text),
  ]);

  const lineEntriesForCoverage = lineEntries.map((entry) => {
    if (skillsCoverageLines.includes(entry.text.toLowerCase())) {
      return { ...entry, region: entry.region === 'other' ? 'skills' : entry.region };
    }
    return entry;
  });

  const keywordCoverage = computeKeywordCoverage({
    normalizedText,
    lineEntries: lineEntriesForCoverage,
    roleId,
  });

  const stackContradictions = buildStackContradictions(lineEntriesForCoverage);
  const extractionQuality = analyzeExtractionQuality(lineEntries, mergedBulletLines);
  const sectionCount = Object.values(sectionsPresent).filter(Boolean).length;
  const hasContactSignal = EMAIL_RE.test(normalizedText) || PHONE_RE.test(normalizedText) || LINKEDIN_RE.test(normalizedText);
  const cvSignalScore = (
    (hasContactSignal ? 2 : 0)
    + (sectionCount >= 2 ? 2 : 0)
    + (sectionsPresent.experience ? 2 : 0)
    + (bulletCount >= 4 ? 2 : 0)
    + (dateFormatsUsed > 0 ? 1 : 0)
  );
  const likelyNonCv = cvSignalScore <= 2
    || (!hasContactSignal && sectionCount === 0 && bulletCount === 0);

  return {
    roleId,
    text: normalizedText,
    textLength: normalizedText.length,
    lines,
    nonEmptyLines: lineEntries.map((entry) => entry.text),
    lineEntries,
    sectionsPresent,
    sectionLines,
    sectionCount,
    cvSignalScore,
    likelyNonCv,
    sectionDetection: {
      explicitHeadings: explicitSectionHeadings,
      aliasDetections: {
        skills: skillsAlias,
        summary: summaryAlias,
      },
      implicitByAlias: {
        skills: skillsImplicitlyDetected,
        summary: summaryImplicitlyDetected,
      },
      headingSuggestion: {
        skills: skillsImplicitlyDetected,
        summary: summaryImplicitlyDetected,
      },
    },
    contact: {
      hasEmail: EMAIL_RE.test(normalizedText),
      hasPhone: PHONE_RE.test(normalizedText),
      hasLinkedIn: LINKEDIN_RE.test(normalizedText),
    },
    bulletCount,
    bulletLines,
    bulletsWithMetrics,
    numericBulletRatio: bulletCount ? bulletsWithMetrics / bulletCount : 0,
    experienceBulletCount: experienceBullets.length,
    experienceBulletsWithNumbers,
    responsibleForCount,
    responsibleForRatio: bulletCount ? responsibleForCount / bulletCount : 0,
    weakActionVerbCount,
    weakActionVerbRatio: bulletCount ? weakActionVerbCount / bulletCount : 0,
    repeatedBulletStartRatio,
    shortBulletCount,
    shortBulletRatio: bulletCount ? shortBulletCount / bulletCount : 0,
    outcomeLanguageCount,
    outcomeEvidenceCount,
    outcomeRatio: experienceBullets.length ? (outcomeEvidenceCount / experienceBullets.length) : 0,
    bulletsWithoutOutcome,
    scopeLanguageCount,
    mixedBulletMarkers,
    trailingPunctuationMixed,
    mergedBullets: {
      suspected: mergedBulletLines.length > 0,
      count: mergedBulletLines.length,
      evidence: mergedBulletLines.slice(0, 4),
    },
    stackContradictions,
    dateFormats: {
      monthYear: dateFormatEvidence['MMM YYYY'].length + dateFormatEvidence['Month YYYY'].length,
      slashDate: dateFormatEvidence['MM/YYYY'].length,
      yearOnly: dateFormatEvidence.YYYY.length,
      usedCount: dateFormatsUsed,
      usedFormats: dateFormatsUsedList,
      suggestedFormat: DATE_FORMAT_RECOMMENDED,
      evidence: dateFormatEvidence,
    },
    duplicateLineCount,
    longLineCount,
    capsHeavyLineCount,
    spacingIssueCount: countSpacingIssues(rawText),
    specialCharRatio,
    extractionQuality,
    keywordCoverage,
  };
}

module.exports = {
  ACTION_VERBS,
  normalizeCvText,
  buildCvContext,
};
