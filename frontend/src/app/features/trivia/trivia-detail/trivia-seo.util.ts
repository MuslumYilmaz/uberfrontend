import { Question } from '../../../core/models/question.model';

const TITLE_MAX_LEN = 54;
const DESCRIPTION_MAX_LEN = 155;
const INTERVIEW_TITLE_SUFFIX = ': Interview Answer';
const INTERVIEW_INTENT_RE = /\b(interview(?:s)?|prep(?:aration)?|practice|candidate(?:s)?|round(?:s)?|follow[\s-]?ups?|drill(?:s)?|question(?:s)?|answer(?:s)?)\b/i;

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

function questionSeoTitle(q: Pick<Question, 'seo'>): string {
  const raw = typeof q?.seo?.title === 'string' ? q.seo.title : '';
  return sanitizeSerpText(raw, TITLE_MAX_LEN);
}

function questionSeoDescription(q: Pick<Question, 'seo'>): string {
  const raw = typeof q?.seo?.description === 'string' ? q.seo.description : '';
  return sanitizeSerpText(raw, DESCRIPTION_MAX_LEN);
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
  if (beforeColon && title.length > 46 && beforeColon.length >= 10) {
    return sanitizeSerpText(beforeColon, 46);
  }

  return sanitizeSerpText(
    title
      .replace(/^(what|why|how|when|where)\s+(does|is|are|to|can|do|should)\s+/i, '')
      .replace(/^(what|why|how|when|where)\s+/i, '')
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
    .replace(/\?+$/, '')
    .trim();

  return cleaned.length >= 8 ? sanitizeSerpText(cleaned, 88) : title;
}

function hasInterviewIntent(value: string): boolean {
  return INTERVIEW_INTENT_RE.test(String(value || ''));
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

export function seoTitleForQuestion(q: Pick<Question, 'id' | 'title' | 'technology' | 'seo'>): string {
  const explicit = questionSeoTitle(q);
  const framework = frameworkLabel(q.technology);
  if (explicit) {
    return hasInterviewIntent(explicit) ? explicit : interviewAnswerTitle(q, framework);
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
    : interviewAnswerTitle(q, framework);
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
  const article = /^(Angular|HTML)$/i.test(framework) ? 'an' : 'a';
  return sanitizeSerpText(
    `Practice ${article} ${framework} interview answer for ${concept}: quick answer, common mistake, follow-up, and production pitfall.`,
    DESCRIPTION_MAX_LEN
  );
}

export function seoDescriptionForQuestion(
  q: Pick<Question, 'id' | 'title' | 'technology' | 'seo'>,
  plainDescription: string,
  tech: string
): string {
  const explicit = questionSeoDescription(q);
  const framework = frameworkLabel(q.technology || tech);
  if (explicit) {
    return hasInterviewIntent(explicit) ? explicit : interviewAnswerDescription(q, framework);
  }

  const concept = titleConcept(q)
    || slugToConcept((q as any).id, (q as any).technology || tech)
    || 'front-end concept';
  const questionTitle = normalizedQuestionTitle(q);
  const lead = questionTitle
    ? `${framework} interview answer for ${questionTitle}.`
    : `${framework} interview answer for ${concept}.`;
  const platformHint = 'Use it in your frontend interview prep routine with guided tracks and company-specific drills.';
  const leadAndHint = sanitizeSerpText(`${lead} ${platformHint}`, DESCRIPTION_MAX_LEN);
  const remainingForBody = Math.max(40, DESCRIPTION_MAX_LEN - leadAndHint.length - 1);
  const descFromContent = sanitizeSerpText(plainDescription || '', remainingForBody);
  const body = descFromContent
    || sanitizeSerpText(
      `${framework} explanation with tradeoffs, common mistakes, and real-world examples.`,
      remainingForBody
    );

  return sanitizeSerpText(
    `${lead} ${body} ${platformHint}`,
    DESCRIPTION_MAX_LEN
  );
}
