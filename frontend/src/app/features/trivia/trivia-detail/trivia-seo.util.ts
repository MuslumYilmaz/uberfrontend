import { Question } from '../../../core/models/question.model';
import { normalizeSeoPlainText } from '../../../core/utils/seo-text.util';

const TITLE_SOFT_LEN = 54;
const INTERVIEW_TITLE_SUFFIX = ': Interview Answer';
const INTERVIEW_INTENT_RE = /\b(interview(?:s)?|interviewer(?:s)?|prep(?:aration)?|practice|candidate(?:s)?|round(?:s)?|follow[\s-]?ups?|drill(?:s)?|question(?:s)?|answer(?:s)?)\b/i;
const DOCS_INTENT_RE = /\b(?:official\s+docs?|docs\s+wording|memorized\s+docs\s+wording|official\s+documentation|documentation|official\s+guide|official\s+api|api\s+docs?|api\s+reference)\b/i;
const ANSWER_FIRST_RE = /^(yes|no|it depends)\s*[:.—]/i;
const PROBLEM_FIRST_RE = /\b(?:running|runs|called|firing)\s+twice\b|\bduplicate\s+(?:fetches|listeners|requests|api\s+calls)\b|\bmissing\s+returns?\b|\b(?:bugs?|fix(?:es|ing)?|gotchas?|leaks?|pitfalls?)\b/i;
const APPLIED_REVIEW_INTENT_RE = /\b(?:code[\s-]?review|pull requests?|case files?|review clinic|predict (?:the )?(?:failure|result|output|behavior))\b/i;
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

export function sanitizeSerpText(input: string): string {
  return normalizeSeoPlainText(input);
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
      .replace(/\b\w/g, (ch) => ch.toUpperCase())
  );
}

function cleanQuestionConcept(rawTitle: string): string {
  const title = sanitizeSerpText(rawTitle).replace(/\?+$/, '').trim();
  if (!title) return '';

  const difference = title.match(/^what\s+is\s+the\s+difference\s+between\s+(.+?)\s+and\s+(.+)$/i);
  if (difference) {
    return sanitizeSerpText(`${difference[1]} vs ${difference[2]}`);
  }

  const broadDifference = title.match(/^what\s+is\s+the\s+difference\s+between\s+(.+)$/i);
  if (broadDifference) {
    return sanitizeSerpText(broadDifference[1]);
  }

  const doesDo = title.match(/^what\s+does\s+(.+?)\s+do$/i);
  if (doesDo) {
    return sanitizeSerpText(doesDo[1]);
  }

  const howWorks = title.match(/^how\s+(?:does|do)\s+(.+?)\s+work$/i);
  if (howWorks) {
    return sanitizeSerpText(howWorks[1]);
  }

  return sanitizeSerpText(
    title
      .replace(/^(what|why|how|when|where)\s+(does|is|are|to|can|do|should)\s+/i, '')
      .replace(/^(what|why|how|when|where)\s+/i, '')
      .replace(/^(does|do|can|should|will|is|are)\s+/i, '')
      .replace(/\s+do$/i, '')
      .trim()
  );
}

function titleConcept(q: Pick<Question, 'title' | 'id' | 'technology'>): string {
  const title = sanitizeSerpText(String(q.title || '').trim());
  if (title) {
    const trimmed = cleanQuestionConcept(title);
    if (trimmed.length >= 10) return sanitizeSerpText(trimmed);
  }
  return slugToConcept((q as any).id, (q as any).technology);
}

function normalizedQuestionTitle(q: Pick<Question, 'title'>): string {
  const title = sanitizeSerpText(String(q.title || '').trim());
  if (!title) return '';

  const cleaned = title
    .replace(/^(what|why|how|when|where)\s+(does|is|are|to|can|do)\s+/i, '')
    .replace(/^(what|why|how|when|where)\s+/i, '')
    .replace(/^(does|do|can|should|will|is|are)\s+/i, '')
    .replace(/\?+$/, '')
    .trim();

  return cleaned.length >= 8 ? sanitizeSerpText(cleaned) : title;
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
    || APPLIED_REVIEW_INTENT_RE.test(text)
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
  const title = sanitizeSerpText(String(q.title || '').trim()).replace(/\?+$/, '').trim();
  const difference = title.match(/^what\s+is\s+the\s+difference\s+between\s+(.+?)\s+and\s+(.+)$/i);
  if (difference) {
    return sanitizeSerpText(
      `${stripFrameworkPrefix(difference[1], framework)} vs ${stripFrameworkSuffix(difference[2], framework)}`
    );
  }

  const vs = title.match(/^(.+?)\s+vs\.?\s+(.+?)(?::|$)/i);
  if (vs) {
    return sanitizeSerpText(
      `${stripFrameworkPrefix(vs[1], framework)} vs ${stripFrameworkSuffix(vs[2], framework)}`
    );
  }

  const concept = titleConcept(q);
  if (/\bvs\.?\b/i.test(concept)) {
    return sanitizeSerpText(stripFrameworkSuffix(concept, framework));
  }

  return '';
}

function ensureFrameworkInConcept(concept: string, framework: string): string {
  const normalizedConcept = sanitizeSerpText(concept);
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
  const concept = ensureFrameworkInConcept(rawConcept, framework);
  return withOptionalInterviewSuffix(concept);
}

function withOptionalInterviewSuffix(concept: string): string {
  const title = sanitizeSerpText(concept);
  const withSuffix = `${title}${INTERVIEW_TITLE_SUFFIX}`;
  return withSuffix.length <= TITLE_SOFT_LEN ? withSuffix : title;
}

function retargetedTitle(
  q: Pick<Question, 'id' | 'title' | 'technology'>,
  framework: string
): string {
  const comparison = comparisonConcept(q, framework);
  if (comparison) {
    return withOptionalInterviewSuffix(`${comparison} in ${framework}`);
  }

  const behaviorQuestion = sanitizeSerpText(String(q.title || '').trim());
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
  const explicit = sanitizeSerpText(rawExplicitAllowed ? rawExplicit : '');
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
  const candidate = sanitizeSerpText(prefixedQuestionTitle);
  const normalized = hasInterviewIntent(candidate)
    ? candidate
    : retargetedTitle(q, framework);
  if (normalized) return normalized;

  return sanitizeSerpText(`${framework} interview answer`);
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
      `${comparison} in ${framework}: quick interview answer, examples, common mistakes, and production pitfalls.`
    );
  }

  if (hasBehaviorQuestionIntent(`${q.title || ''} ${(q as any).id || ''}`)) {
    return sanitizeSerpText(
      `Understand ${concept}: quick answer, real example, common mistake, and senior interview follow-up.`
    );
  }

  return sanitizeSerpText(
    `Practice ${concept} with a quick interview answer, examples, common mistakes, and production-focused follow-ups.`
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
  const explicit = sanitizeSerpText(rawExplicitAllowed ? rawExplicit : '');
  const framework = frameworkLabel(q.technology || tech);
  if (explicit) {
    return rawExplicitHasRetargetedIntent
      ? explicit
      : interviewAnswerDescription(q, framework);
  }

  return interviewAnswerDescription(q, framework);
}
