import { FRAMEWORK_FAMILY_BY_ID } from './framework-families';

export type CompanyCountKind = 'coding' | 'trivia' | 'system';
export type CompanyCountBucket = { all: number; coding: number; trivia: number; system: number };

type CompanyCountSets = { coding: Set<string>; trivia: Set<string>; system: Set<string> };

const emptySets = (): CompanyCountSets => ({
  coding: new Set<string>(),
  trivia: new Set<string>(),
  system: new Set<string>(),
});

function canonicalCompanyQuestionKey(q: any, kind: CompanyCountKind): string {
  const id = String(q?.id || '').trim();
  const slug = String(q?.slug || '').trim();
  const title = String(q?.title || '').trim();
  const famKey = id ? FRAMEWORK_FAMILY_BY_ID.get(id)?.key : undefined;
  const base = famKey ?? id ?? slug ?? title;
  return `${kind}:${base || 'unknown'}`;
}

function normalizeCompanySlug(value: any): string | null {
  if (value == null) return null;
  const s = String(value).trim().toLowerCase();
  return s ? s : null;
}

export function collectCompanyCounts(lists: {
  coding?: any[];
  trivia?: any[];
  system?: any[];
}): Record<string, CompanyCountBucket> {
  const buckets = new Map<string, CompanyCountSets>();

  const add = (q: any, kind: CompanyCountKind) => {
    const companies = Array.isArray(q?.companies) ? q.companies : [];
    if (!companies.length) return;
    const key = canonicalCompanyQuestionKey(q, kind);
    for (const raw of companies) {
      const slug = normalizeCompanySlug(raw);
      if (!slug) continue;
      if (!buckets.has(slug)) buckets.set(slug, emptySets());
      buckets.get(slug)![kind].add(key);
    }
  };

  (lists.coding ?? []).forEach((q) => add(q, 'coding'));
  (lists.trivia ?? []).forEach((q) => add(q, 'trivia'));
  (lists.system ?? []).forEach((q) => add(q, 'system'));

  const out: Record<string, CompanyCountBucket> = {};
  buckets.forEach((set, slug) => {
    const coding = set.coding.size;
    const trivia = set.trivia.size;
    const system = set.system.size;
    out[slug] = {
      coding,
      trivia,
      system,
      all: coding + trivia + system,
    };
  });

  return out;
}
