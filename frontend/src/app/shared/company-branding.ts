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
  // No openly licensed Waymo mark exists, so Waymo keeps its monogram.
  waymo: {
    slug: 'waymo',
    label: 'Waymo',
    monogram: 'W',
  },
  elevenlabs: {
    slug: 'elevenlabs',
    label: 'ElevenLabs',
    logoUrl: `${COMPANY_LOGO_BASE}/elevenlabs.svg`,
    monogram: 'E',
  },
  datadog: {
    slug: 'datadog',
    label: 'Datadog',
    logoUrl: `${COMPANY_LOGO_BASE}/datadog.svg`,
    monogram: 'D',
  },
  intuit: {
    slug: 'intuit',
    label: 'Intuit',
    logoUrl: `${COMPANY_LOGO_BASE}/intuit.svg`,
    monogram: 'I',
  },
  // Simple Icons lists ServiceNow as permission required, so it keeps its monogram.
  servicenow: {
    slug: 'servicenow',
    label: 'ServiceNow',
    monogram: 'S',
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
  'booking-com': {
    slug: 'booking-com',
    label: 'Booking.com',
    logoUrl: `${COMPANY_LOGO_BASE}/booking-com.svg`,
    monogram: 'B',
  },
  revolut: {
    slug: 'revolut',
    label: 'Revolut',
    logoUrl: `${COMPANY_LOGO_BASE}/revolut.svg`,
    monogram: 'R',
  },
  spotify: {
    slug: 'spotify',
    label: 'Spotify',
    logoUrl: `${COMPANY_LOGO_BASE}/spotify.svg`,
    monogram: 'S',
  },
  zalando: {
    slug: 'zalando',
    label: 'Zalando',
    logoUrl: `${COMPANY_LOGO_BASE}/zalando.svg`,
    monogram: 'Z',
  },
  // Walmart's brand center forbids using its logos without written consent, and
  // Simple Icons dropped the mark, so Walmart keeps its monogram.
  walmart: {
    slug: 'walmart',
    label: 'Walmart',
    monogram: 'W',
  },
  tesla: {
    slug: 'tesla',
    label: 'Tesla',
    logoUrl: `${COMPANY_LOGO_BASE}/tesla.svg`,
    monogram: 'T',
  },
  // Tagged on 2026-10-21. Simple Icons has no JPMorgan, Agoda or xAI mark (checked again on 2026-11-20 against
  // Simple Icons 16.36.0), so JPMorgan and Agoda keep monograms; xAI's mark is Boxicons' bxl-xai (MIT), added 2026-11-20.
  jpmorgan: {
    slug: 'jpmorgan',
    label: 'JPMorgan Chase',
    monogram: 'J',
  },
  agoda: {
    slug: 'agoda',
    label: 'Agoda',
    monogram: 'A',
  },
  xai: {
    slug: 'xai',
    label: 'xAI',
    logoUrl: `${COMPANY_LOGO_BASE}/xai.svg`,
    monogram: 'X',
  },
  // Tagged on 2026-10-21; the mark is from Simple Icons 16.36.0 (added 2026-11-20).
  shopee: {
    slug: 'shopee',
    label: 'Shopee',
    logoUrl: `${COMPANY_LOGO_BASE}/shopee.svg`,
    monogram: 'S',
  },
  // Tagged on 2026-10-23; Simple Icons has no Anduril mark, so it keeps a monogram.
  anduril: {
    slug: 'anduril',
    label: 'Anduril',
    monogram: 'A',
  },
  gitlab: {
    slug: 'gitlab',
    label: 'GitLab',
    logoUrl: `${COMPANY_LOGO_BASE}/gitlab.svg`,
    monogram: 'G',
  },
  // Tagged on 2026-10-23; Simple Icons has no Capital One mark, so it keeps a monogram.
  'capital-one': {
    slug: 'capital-one',
    label: 'Capital One',
    monogram: 'C',
  },
  // Tagged on 2026-10-26; Simple Icons has no CrowdStrike mark, so it keeps a monogram.
  crowdstrike: {
    slug: 'crowdstrike',
    label: 'CrowdStrike',
    monogram: 'C',
  },
  // Tagged on 2026-11-14. Cloudflare's mark is from Simple Icons, which has none for Disney; Disney's is Tabler Icons'
  // brand-disney outline (MIT), added 2026-11-20.
  cloudflare: {
    slug: 'cloudflare',
    label: 'Cloudflare',
    logoUrl: `${COMPANY_LOGO_BASE}/cloudflare.svg`,
    monogram: 'C',
  },
  disney: {
    slug: 'disney',
    label: 'Disney',
    logoUrl: `${COMPANY_LOGO_BASE}/disney.svg`,
    monogram: 'D',
  },
  // Tagged on 2026-11-20; the mark is from Simple Icons 16.36.0.
  binance: {
    slug: 'binance',
    label: 'Binance',
    logoUrl: `${COMPANY_LOGO_BASE}/binance.svg`,
    monogram: 'B',
  },
  notion: {
    slug: 'notion',
    label: 'Notion',
    logoUrl: `${COMPANY_LOGO_BASE}/notion.svg`,
    monogram: 'N',
  },
  // Simple Icons 16.36.0 has no Airwallex mark, so Airwallex keeps its monogram.
  airwallex: {
    slug: 'airwallex',
    label: 'Airwallex',
    monogram: 'A',
  },
  // Simple Icons 16.36.0 has no Verkada mark, so Verkada keeps its monogram.
  verkada: {
    slug: 'verkada',
    label: 'Verkada',
    monogram: 'V',
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

