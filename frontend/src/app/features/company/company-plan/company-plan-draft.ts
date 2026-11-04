import type { CompanyPlanAnswers } from '../../../core/models/company-plan.model';

/** Where a plan started in this browser waits until it reaches an account. */
export const COMPANY_PLAN_DRAFT_KEY = 'fa:company-plan:draft:v1';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ROUND_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LEVELS = new Set(['junior', 'mid', 'senior', 'staff']);
const WHENS = new Set(['tomorrow', 'this-week', 'next-week', 'later']);
const MAX_COMPANIES = 3;
const MAX_PASSED_ROUNDS = 60;

/** The answers with nothing unexpected in them, or null when they cannot be a plan. */
export function cleanCompanyPlanAnswers(raw: unknown): CompanyPlanAnswers | null {
  const value = raw as Partial<CompanyPlanAnswers> | null;
  if (!value || typeof value !== 'object' || !Array.isArray(value.companies)) return null;
  if (!LEVELS.has(String(value.level)) || !WHENS.has(String(value.when))) return null;
  if (value.companies.length < 1 || value.companies.length > MAX_COMPANIES) return null;
  const companies: { slug: string; list?: string }[] = [];
  for (const company of value.companies) {
    if (!SLUG.test(String(company?.slug)) || companies.some((other) => other.slug === company.slug)) return null;
    if (company.list !== undefined && !SLUG.test(String(company.list))) return null;
    companies.push(company.list ? { slug: company.slug, list: company.list } : { slug: company.slug });
  }
  // Passed rounds stay only as keys of the plan's own companies; anything else is dropped rather than refused, so a
  // stale draft can still become a plan. An empty or missing list is left out: it states nothing.
  const passedRounds = Array.isArray(value.passedRounds)
    ? [...new Set(value.passedRounds.filter((key): key is string => typeof key === 'string' && ROUND_KEY.test(key) && companies.some((company) => company.slug === key.split('/')[0])))]
      .sort()
      .slice(0, MAX_PASSED_ROUNDS)
    : [];
  return {
    companies,
    level: value.level as CompanyPlanAnswers['level'],
    when: value.when as CompanyPlanAnswers['when'],
    ...(passedRounds.length ? { passedRounds } : {}),
  };
}

/**
 * The plan started in this browser, read without changing anything, for pages that only mention it. Browser only:
 * call it after the first render.
 */
export function readCompanyPlanDraft(): CompanyPlanAnswers | null {
  try {
    const stored = localStorage.getItem(COMPANY_PLAN_DRAFT_KEY);
    return stored ? cleanCompanyPlanAnswers(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}
