import type { AuthoredCompanyPreview, AuthoredSource } from '../../../shared/company-previews/authored-company-preview.model';
import type { CompanyInterviewProcess, InterviewProcessSource } from '../../../shared/company-previews/company-interview-processes';

/**
 * The evidence behind an authored company guide, counted once for the whole page: the guide's own sources plus
 * every source the reported process table cites. The hero, the source boundary, the gates and the sources
 * section all read these counts, so a page never shows two different numbers for the same thing. Authored text
 * writes a count as a token, `{reports}` for "seven" or `{#reports}` for "7", and never as a hand-written number;
 * scripts/lint-company-counts.mjs enforces that. No Angular import here: the lint loads this module in Node.
 * It lives beside the component, not under shared/company-previews, because the SEO content inventory would
 * otherwise date every company guide by this one file; a change to its generated copy is a shared release.
 */
export type CompanyEvidenceCounts = {
  /** Public interview accounts: reports in the sources list and on the process table, by URL. */
  readonly reports: number;
  /** Official company pages, the same way. */
  readonly official: number;
  /** reports + official. */
  readonly sources: number;
  /** Practice prompts on the page. */
  readonly prompts: number;
};

export type CompanyEvidence = {
  readonly counts: CompanyEvidenceCounts;
  /** The guide's own sources with their notes, then the ones only the process table cites, with the rounds that cite them. */
  readonly sources: readonly AuthoredSource[];
};

export const COUNT_KEYS = ['reports', 'official', 'sources', 'prompts'] as const;
export type CountKey = (typeof COUNT_KEYS)[number];

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const TOKEN = /\{(#?)(reports|official|sources|prompts)\}/g;

/** "seven", "twenty-three", "thirty"; digits past thirty or below zero. */
export function countWord(count: number): string {
  if (count >= 0 && count < WORDS.length) return WORDS[count];
  if (count > 20 && count < 30) return `twenty-${WORDS[count - 20]}`;
  return count === 30 ? 'thirty' : String(count);
}

function monthWords(date: string): string {
  const [year, month] = date.split('-').map(Number);
  return MONTHS[month - 1] ? `${MONTHS[month - 1]} ${year}` : date;
}

function joinWords(words: readonly string[]): string {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/** A process table source the guide's list lacks, as a sources row that says where the table uses it. */
function citedSource(source: InterviewProcessSource, stages: readonly string[]): AuthoredSource {
  const rounds = joinWords(stages);
  return source.kind === 'report'
    ? {
        label: `${source.label} account, ${monthWords(source.date)}`,
        url: source.url,
        kind: 'report',
        note: `A public account read for the process table, where it describes the ${rounds}. One candidate's loop, not a fixed format.`,
      }
    : {
        label: source.label,
        url: source.url,
        kind: 'official',
        note: `An official page read for the process table, where it describes the ${rounds}. Process context, not interview content.`,
      };
}

export function companyEvidence(preview: AuthoredCompanyPreview, process: CompanyInterviewProcess | null): CompanyEvidence {
  const curated = preview.sources.items;
  const seen = new Set(curated.map((source) => source.url));
  const cited = new Map<string, { source: InterviewProcessSource; stages: string[] }>();
  for (const variant of process?.variants ?? []) {
    for (const stage of variant.stages) {
      for (const source of stage.sources) {
        const entry = cited.get(source.url) ?? { source, stages: [] };
        if (!entry.stages.includes(stage.stage)) entry.stages.push(stage.stage);
        cited.set(source.url, entry);
      }
    }
  }
  const extra: AuthoredSource[] = [];
  for (const { source, stages } of cited.values()) {
    if (seen.has(source.url)) continue;
    seen.add(source.url);
    extra.push(citedSource(source, stages));
  }
  const sources = [...curated, ...extra];
  const reports = sources.filter((source) => source.kind === 'report').length;
  return {
    counts: { reports, official: sources.length - reports, sources: sources.length, prompts: preview.prompts.items.length },
    sources,
  };
}

/** Replaces count tokens: `{reports}` becomes "seven" ("Seven" at a sentence start), `{#reports}` becomes "7". */
export function fillCompanyCounts(text: string, counts: CompanyEvidenceCounts): string {
  return text.replace(TOKEN, (_match, digits: string, key: CountKey, offset: number, whole: string) => {
    const value = counts[key];
    if (digits) return String(value);
    const word = countWord(value);
    const before = whole.slice(0, offset).trimEnd();
    return before === '' || /[.!?:]$/.test(before) ? word.charAt(0).toUpperCase() + word.slice(1) : word;
  });
}

/** The authored fields that may carry a count token: what the lint reads and what the page fills. */
export function authoredCountFields(preview: AuthoredCompanyPreview): readonly { readonly field: string; readonly text: string }[] {
  return [
    { field: 'title', text: preview.title },
    { field: 'description', text: preview.description },
    { field: 'trustNote', text: preview.trustNote },
    { field: 'hero.subtitle', text: preview.hero.subtitle },
    { field: 'hero.caveat', text: preview.hero.caveat },
    ...preview.hero.chips.map((text, index) => ({ field: `hero.chips[${index}]`, text })),
    ...preview.studyPriorities.paragraphs.map((text, index) => ({ field: `studyPriorities.paragraphs[${index}]`, text })),
    ...preview.sourceBoundary.paragraphs.map((text, index) => ({ field: `sourceBoundary.paragraphs[${index}]`, text })),
    { field: 'prompts.intro', text: preview.prompts.intro },
    { field: 'sources.intro', text: preview.sources.intro },
  ];
}

/** The guide with every count token filled, for the page and its metadata. */
export function fillAuthoredPreview(preview: AuthoredCompanyPreview, counts: CompanyEvidenceCounts): AuthoredCompanyPreview {
  const fill = (text: string) => fillCompanyCounts(text, counts);
  return {
    ...preview,
    title: fill(preview.title),
    description: fill(preview.description),
    trustNote: fill(preview.trustNote),
    hero: { ...preview.hero, subtitle: fill(preview.hero.subtitle), caveat: fill(preview.hero.caveat), chips: preview.hero.chips.map(fill) },
    studyPriorities: { ...preview.studyPriorities, paragraphs: preview.studyPriorities.paragraphs.map(fill) },
    sourceBoundary: { ...preview.sourceBoundary, paragraphs: preview.sourceBoundary.paragraphs.map(fill) },
    prompts: { ...preview.prompts, intro: fill(preview.prompts.intro) },
    sources: { ...preview.sources, intro: fill(preview.sources.intro) },
  };
}
