export type CompanyBrand = {
  slug: string;
  label: string;
  logoUrl?: string;
  monogram: string;
};

export type CompanySignal = {
  primary: CompanyBrand;
  overflowCount: number;
  ariaLabel: string;
};

const COMPANY_LOGO_BASE = '/assets/images/company-logos';

export const COMPANY_BRANDS: Record<string, CompanyBrand> = {
  google: {
    slug: 'google',
    label: 'Google',
    logoUrl: `${COMPANY_LOGO_BASE}/google.svg`,
    monogram: 'G',
  },
  amazon: {
    slug: 'amazon',
    label: 'Amazon',
    logoUrl: `${COMPANY_LOGO_BASE}/amazon.svg`,
    monogram: 'A',
  },
  apple: {
    slug: 'apple',
    label: 'Apple',
    logoUrl: `${COMPANY_LOGO_BASE}/apple.svg`,
    monogram: 'A',
  },
  meta: {
    slug: 'meta',
    label: 'Meta',
    logoUrl: `${COMPANY_LOGO_BASE}/meta.svg`,
    monogram: 'M',
  },
  microsoft: {
    slug: 'microsoft',
    label: 'Microsoft',
    logoUrl: `${COMPANY_LOGO_BASE}/microsoft.svg`,
    monogram: 'M',
  },
  uber: {
    slug: 'uber',
    label: 'Uber',
    logoUrl: `${COMPANY_LOGO_BASE}/uber.svg`,
    monogram: 'U',
  },
  airbnb: {
    slug: 'airbnb',
    label: 'Airbnb',
    logoUrl: `${COMPANY_LOGO_BASE}/airbnb.svg`,
    monogram: 'A',
  },
  netflix: {
    slug: 'netflix',
    label: 'Netflix',
    logoUrl: `${COMPANY_LOGO_BASE}/netflix.svg`,
    monogram: 'N',
  },
  bytedance: {
    slug: 'bytedance',
    label: 'ByteDance',
    logoUrl: `${COMPANY_LOGO_BASE}/bytedance.svg`,
    monogram: 'B',
  },
  openai: {
    slug: 'openai',
    label: 'OpenAI',
    logoUrl: `${COMPANY_LOGO_BASE}/openai.svg`,
    monogram: 'O',
  },
  stripe: {
    slug: 'stripe',
    label: 'Stripe',
    logoUrl: `${COMPANY_LOGO_BASE}/stripe.svg`,
    monogram: 'S',
  },
};

const COMPANY_ALIASES: Record<string, string> = {
  'byte-dance': 'bytedance',
  'open-ai': 'openai',
  facebook: 'meta',
};

export function normalizeCompanySlug(value: unknown): string | null {
  if (value == null) return null;
  const slug = String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!slug) return null;
  return COMPANY_ALIASES[slug] ?? slug;
}

export function companyBrandFor(value: unknown): CompanyBrand | null {
  const slug = normalizeCompanySlug(value);
  if (!slug) return null;
  const known = COMPANY_BRANDS[slug];
  if (known) return known;

  const label = slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  return {
    slug,
    label: label || slug.toUpperCase(),
    monogram: (label || slug).charAt(0).toUpperCase(),
  };
}

export function companySignalFor(
  companies: readonly unknown[] | null | undefined,
  preferredSlug?: string | null
): CompanySignal | null {
  const slugs = Array.from(
    new Set((companies ?? []).map(normalizeCompanySlug).filter((slug): slug is string => !!slug))
  );
  if (!slugs.length) return null;

  const preferred = normalizeCompanySlug(preferredSlug);
  if (preferred && slugs.includes(preferred)) {
    slugs.splice(slugs.indexOf(preferred), 1);
    slugs.unshift(preferred);
  }

  const primary = companyBrandFor(slugs[0]);
  if (!primary) return null;

  const overflowCount = Math.max(0, slugs.length - 1);
  return {
    primary,
    overflowCount,
    ariaLabel: overflowCount
      ? `Company prep signal: ${primary.label} and ${overflowCount} more`
      : `Company prep signal: ${primary.label}`,
  };
}

