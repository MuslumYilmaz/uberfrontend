import { Question } from '../../../core/models/question.model';

const TITLE_MAX_LEN = 54;
const DESCRIPTION_MAX_LEN = 155;
const INTERVIEW_TITLE_SUFFIX = ': Interview Answer';
const INTERVIEW_INTENT_RE = /\b(interview(?:s)?|interviewer(?:s)?|prep(?:aration)?|practice|candidate(?:s)?|round(?:s)?|follow[\s-]?ups?|drill(?:s)?|question(?:s)?|answer(?:s)?)\b/i;
const DOCS_INTENT_RE = /\b(?:official\s+docs?|docs\s+wording|memorized\s+docs\s+wording|official\s+documentation|documentation|official\s+guide|official\s+api|api\s+docs?|api\s+reference)\b/i;
const ANSWER_FIRST_RE = /^(yes|no|it depends)\s*[:.]/i;
const PROBLEM_FIRST_RE = /\b(?:running|runs|called|firing)\s+twice\b|\bduplicate\s+(?:fetches|listeners|requests|api\s+calls)\b|\b(?:bugs?|fix(?:es|ing)?|gotchas?|leaks?|pitfalls?)\b/i;
const BEHAVIOR_QUESTION_RE = /^(?:does|do|why|how)\b|\b(?:what\s+actually\s+happens|what\s+happens|how\s+(?:does|do).+\bwork|why\s+.+\bhappen|cancel(?:s|led|lation)?|unsubscribe|rerun|re-run|recompute|render(?:s|ing)?|execute(?:s|d)?|fire(?:s|d)?|update(?:s|d)?|mutate(?:s|d)?|leak(?:s|ed)?)\b/i;

const TECH_LABELS: Record<string, string> = {
  javascript: 'JavaScript',
  react: 'React',
  angular: 'Angular',
  vue: 'Vue',
  html: 'HTML',
  css: 'CSS',
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;(?=lt;|gt;|amp;|quot;|#39;)/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function trimWordBoundary(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value;

  const sliced = value.slice(0, Math.max(0, maxLen)).trimEnd();
  const minSoftBreak = Math.floor(maxLen * 0.65);
  const breakAt = sliced.lastIndexOf(' ');
  const clipped = breakAt >= minSoftBreak ? sliced.slice(0, breakAt) : sliced;
  return clipped.replace(/[\s,;:/-]+$/g, '').trim();
}

export function sanitizeSerpText(input: string, maxLen: number): string {
  const normalized = normalizeWhitespace(
    decodeHtmlEntities(String(input || ''))
      .replace(/<[^>]+>/g, ' ')
  );

  if (!normalized) return '';
  return trimWordBoundary(normalized, maxLen);
}

function frameworkLabel(tech?: string): string {
  return TECH_LABELS[String(tech || '').trim().toLowerCase()] || 'Frontend';
}

function rawQuestionSeoTitle(q: Pick<Question, 'seo'>): string {
  const raw = typeof q?.seo?.title === 'string' ? q.seo.title : '';
  return normalizeWhitespace(raw);
}

function rawQuestionSeoDescription(q: Pick<Question, 'seo'>): string {
  const raw = typeof q?.seo?.description === 'string' ? q.seo.description : '';
  return normalizeWhitespace(raw);
}

function slugToConcept(id?: string, tech?: string): string {
  const normalizedId = String(id || '').trim().toLowerCase();
  if (!normalizedId) return '';
  const normalizedTech = String(tech || '').trim().toLowerCase();
  const withoutTech = normalizedTech && normalizedId.startsWith(`${normalizedTech}-`)
    ? normalizedId.slice(normalizedTech.length + 1)
    : normalizedId;

  return sanitizeSerpText(
    withoutTech
      .replace(/-/g, ' ')
      .replace(/\bdom\b/gi, 'DOM')
      .replace(/\bjsx\b/gi, 'JSX')
      .replace(/\bapi\b/gi, 'API')
      .replace(/\bhttp\b/gi, 'HTTP')
      .replace(/\bv-if\b/gi, 'v-if')
      .replace(/\bv-show\b/gi, 'v-show')
      .replace(/\btorefs\b/gi, 'toRefs')
      .replace(/\btoref\b/gi, 'toRef')
      .replace(/\bvs\b/gi, 'vs')
      .replace(/\b\w/g, (ch) => ch.toUpperCase()),
    46
  );
}

function cleanQuestionConcept(rawTitle: string): string {
  const title = sanitizeSerpText(rawTitle, 90).replace(/\?+$/, '').trim();
  if (!title) return '';

  const difference = title.match(/^what\s+is\s+the\s+difference\s+between\s+(.+?)\s+and\s+(.+)$/i);
  if (difference) {
    return sanitizeSerpText(`${difference[1]} vs ${difference[2]}`, 46);
  }

  const broadDifference = title.match(/^what\s+is\s+the\s+difference\s+between\s+(.+)$/i);
  if (broadDifference) {
    return sanitizeSerpText(broadDifference[1], 46);
  }

  const doesDo = title.match(/^what\s+does\s+(.+?)\s+do$/i);
  if (doesDo) {
    return sanitizeSerpText(doesDo[1], 46);
  }

  const howWorks = title.match(/^how\s+(?:does|do)\s+(.+?)\s+work$/i);
  if (howWorks) {
    return sanitizeSerpText(howWorks[1], 46);
  }

  const beforeColon = title.split(':')[0]?.trim();
  if (title.includes(':') && beforeColon && title.length > 46 && beforeColon.length >= 10) {
    return sanitizeSerpText(beforeColon, 46);
  }

  return sanitizeSerpText(
    title
      .replace(/^(what|why|how|when|where)\s+(does|is|are|to|can|do|should)\s+/i, '')
      .replace(/^(what|why|how|when|where)\s+/i, '')
      .replace(/^(does|do|can|should|will|is|are)\s+/i, '')
      .replace(/\s+do$/i, '')
      .trim(),
    46
  );
}

function titleConcept(q: Pick<Question, 'title' | 'id' | 'technology'>): string {
  const title = sanitizeSerpText(String(q.title || '').trim(), 70);
  if (title) {
    const trimmed = cleanQuestionConcept(title);
    if (trimmed.length >= 10) return sanitizeSerpText(trimmed, 46);
  }
  return slugToConcept((q as any).id, (q as any).technology);
}

function normalizedQuestionTitle(q: Pick<Question, 'title'>): string {
  const title = sanitizeSerpText(String(q.title || '').trim(), 96);
  if (!title) return '';

  const cleaned = title
    .replace(/^(what|why|how|when|where)\s+(does|is|are|to|can|do)\s+/i, '')
    .replace(/^(what|why|how|when|where)\s+/i, '')
    .replace(/^(does|do|can|should|will|is|are)\s+/i, '')
    .replace(/\?+$/, '')
    .trim();

  return cleaned.length >= 8 ? sanitizeSerpText(cleaned, 88) : title;
}

function hasInterviewIntent(value: string): boolean {
  return INTERVIEW_INTENT_RE.test(String(value || ''));
}

function hasDocsIntent(value: string): boolean {
  return DOCS_INTENT_RE.test(String(value || ''));
}

function hasAnswerFirstIntent(value: string): boolean {
  return ANSWER_FIRST_RE.test(String(value || '').trim());
}

function hasProblemFirstIntent(value: string): boolean {
  return PROBLEM_FIRST_RE.test(String(value || '').trim());
}

function hasBehaviorQuestionIntent(value: string): boolean {
  return BEHAVIOR_QUESTION_RE.test(String(value || '').trim());
}

function hasRetargetedIntent(value: string): boolean {
  const text = String(value || '');
  return hasInterviewIntent(text)
    || hasAnswerFirstIntent(text)
    || hasProblemFirstIntent(text)
    || hasBehaviorQuestionIntent(text)
    || /\b(?:quick answer|real examples?|examples?|common mistakes?|production pitfalls?|when to use|what actually happens)\b/i.test(text);
}

function stripFrameworkSuffix(value: string, framework: string): string {
  const knownFrameworks = ['Angular', 'React', 'Vue', 'JavaScript', 'HTML', 'CSS', 'Frontend'];
  const pattern = new RegExp(`\\s+in\\s+(?:${knownFrameworks.join('|')})\\b.*$`, 'i');
  const stripped = value.replace(pattern, '').trim();
  if (stripped && !new RegExp(`^${framework}\\b`, 'i').test(stripped)) return stripped;
  return value.trim();
}

function stripFrameworkPrefix(value: string, framework: string): string {
  const stripped = value.replace(new RegExp(`^${framework}\\s+`, 'i'), '').trim();
  return stripped || value.trim();
}

function comparisonConcept(
  q: Pick<Question, 'id' | 'title' | 'technology'>,
  framework: string
): string {
  const title = sanitizeSerpText(String(q.title || '').trim(), 110).replace(/\?+$/, '').trim();
  const difference = title.match(/^what\s+is\s+the\s+difference\s+between\s+(.+?)\s+and\s+(.+)$/i);
  if (difference) {
    return sanitizeSerpText(
      `${stripFrameworkPrefix(difference[1], framework)} vs ${stripFrameworkSuffix(difference[2], framework)}`,
      58
    );
  }

  const vs = title.match(/^(.+?)\s+vs\.?\s+(.+?)(?::|$)/i);
  if (vs) {
    return sanitizeSerpText(
      `${stripFrameworkPrefix(vs[1], framework)} vs ${stripFrameworkSuffix(vs[2], framework)}`,
      58
    );
  }

  const concept = titleConcept(q);
  if (/\bvs\.?\b/i.test(concept)) {
    return sanitizeSerpText(stripFrameworkSuffix(concept, framework), 58);
  }

  return '';
}

function ensureFrameworkInConcept(concept: string, framework: string): string {
  const normalizedConcept = sanitizeSerpText(concept, 70);
  if (!normalizedConcept) return framework;
  if (new RegExp(`\\b${framework}\\b`, 'i').test(normalizedConcept)) return normalizedConcept;
  return `${framework} ${normalizedConcept}`;
}

function interviewAnswerTitle(
  q: Pick<Question, 'id' | 'title' | 'technology'>,
  framework: string
): string {
  const rawConcept = titleConcept(q)
    || slugToConcept((q as any).id, (q as any).technology)
    || 'Interview Concept';
  const conceptMaxLen = TITLE_MAX_LEN - INTERVIEW_TITLE_SUFFIX.length;
  const concept = sanitizeSerpText(ensureFrameworkInConcept(rawConcept, framework), conceptMaxLen);
  return sanitizeSerpText(`${concept || framework}${INTERVIEW_TITLE_SUFFIX}`, TITLE_MAX_LEN);
}

function retargetedTitle(
  q: Pick<Question, 'id' | 'title' | 'technology'>,
  framework: string
): string {
  const comparison = comparisonConcept(q, framework);
  if (comparison) {
    return sanitizeSerpText(`${comparison} in ${framework}: Interview Answer`, TITLE_MAX_LEN);
  }

  const behaviorQuestion = sanitizeSerpText(String(q.title || '').trim(), TITLE_MAX_LEN);
  if (behaviorQuestion && hasBehaviorQuestionIntent(behaviorQuestion)) {
    return behaviorQuestion;
  }

  return interviewAnswerTitle(q, framework);
}

export function seoTitleForQuestion(q: Pick<Question, 'id' | 'title' | 'technology' | 'seo'>): string {
  const rawExplicit = rawQuestionSeoTitle(q);
  const rawExplicitDescription = rawQuestionSeoDescription(q);
  const rawExplicitAllowed = rawExplicit && !hasDocsIntent(rawExplicit);
  const rawMetadata = `${rawExplicit} ${rawExplicitDescription}`;
  const rawMetadataHasRetargetedIntent = hasRetargetedIntent(rawMetadata);
  const explicit = rawExplicitAllowed && hasInterviewIntent(rawExplicit)
    ? sanitizeSerpText(rawExplicit, Math.max(TITLE_MAX_LEN, rawExplicit.length))
    : sanitizeSerpText(rawExplicitAllowed ? rawExplicit : '', TITLE_MAX_LEN);
  const framework = frameworkLabel(q.technology);
  if (explicit) {
    return rawMetadataHasRetargetedIntent && !hasDocsIntent(rawMetadata)
      ? explicit
      : retargetedTitle(q, framework);
  }

  const questionTitle = normalizedQuestionTitle(q);
  const concept = titleConcept(q) || 'Interview Concept';
  const prefixedQuestionTitle = questionTitle
    && new RegExp(`^${framework}\\b`, 'i').test(questionTitle)
    ? questionTitle
    : `${framework} ${questionTitle || concept}`;
  const candidate = sanitizeSerpText(prefixedQuestionTitle, TITLE_MAX_LEN);
  const normalized = hasInterviewIntent(candidate)
    ? sanitizeSerpText(candidate, TITLE_MAX_LEN)
    : retargetedTitle(q, framework);
  if (normalized) return normalized;

  return sanitizeSerpText(`${framework} interview answer`, TITLE_MAX_LEN);
}

function interviewAnswerDescription(
  q: Pick<Question, 'id' | 'title' | 'technology'>,
  framework: string
): string {
  const concept = titleConcept(q)
    || slugToConcept((q as any).id, (q as any).technology)
    || 'front-end concept';
  const comparison = comparisonConcept(q, framework);
  if (comparison) {
    return sanitizeSerpText(
      `${comparison} in ${framework}: quick interview answer, examples, common mistakes, and production pitfalls.`,
      DESCRIPTION_MAX_LEN
    );
  }

  if (hasBehaviorQuestionIntent(`${q.title || ''} ${(q as any).id || ''}`)) {
    return sanitizeSerpText(
      `Understand ${concept}: quick answer, real example, common mistake, and senior interview follow-up.`,
      DESCRIPTION_MAX_LEN
    );
  }

  return sanitizeSerpText(
    `Practice ${concept} with a quick interview answer, examples, common mistakes, and production-focused follow-ups.`,
    DESCRIPTION_MAX_LEN
  );
}

export function seoDescriptionForQuestion(
  q: Pick<Question, 'id' | 'title' | 'technology' | 'seo'>,
  plainDescription: string,
  tech: string
): string {
  const rawExplicit = rawQuestionSeoDescription(q);
  const rawExplicitAllowed = rawExplicit && !hasDocsIntent(rawExplicit);
  const rawExplicitHasRetargetedIntent = hasRetargetedIntent(rawExplicit);
  const explicit = rawExplicitAllowed && hasInterviewIntent(rawExplicit)
    ? sanitizeSerpText(rawExplicit, Math.max(DESCRIPTION_MAX_LEN, rawExplicit.length))
    : sanitizeSerpText(rawExplicitAllowed ? rawExplicit : '', DESCRIPTION_MAX_LEN);
  const framework = frameworkLabel(q.technology || tech);
  if (explicit) {
    return rawExplicitHasRetargetedIntent
      ? explicit
      : interviewAnswerDescription(q, framework);
  }

  return interviewAnswerDescription(q, framework);
}
