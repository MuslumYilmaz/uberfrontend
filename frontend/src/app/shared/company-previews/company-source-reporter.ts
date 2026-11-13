import type { InterviewOutcome, InterviewProcessSource } from './company-interview-processes';

/**
 * Who stands behind an interview source, as a guide shows it in place of a link: the role and country an account
 * gives and how its loop ended. Taro experience URLs carry all three, so Taro sources need no authoring; every other
 * account gives them on its source entry, and a field the account does not give stays empty rather than guessed.
 */
export type SourceReporter = {
  readonly role?: string;
  readonly location?: string;
  readonly outcome?: InterviewOutcome;
};

const TARO_EXPERIENCE =
  /^https:\/\/www\.jointaro\.com\/interviews\/companies\/([a-z0-9-]+)\/experiences\/([a-z0-9-]+?)-(?:january|february|march|april|may|june|july|august|september|october|november|december)-\d{1,2}-\d{4}-(no-offer|accepted-offer|declined-offer)-(?:positive|negative|neutral)-[0-9a-f]{8}\/?$/;

const TARO_OUTCOMES: Readonly<Record<string, InterviewOutcome>> = {
  'no-offer': 'no offer',
  'accepted-offer': 'accepted offer',
  'declined-offer': 'declined offer',
};

/**
 * The place at the end of a Taro experience slug, by country: a city alone would claim more than Taro's metadata
 * supports. A slug whose place is missing here keeps it in the role, so the spec fails on any role that does not end
 * in a job word.
 */
const TARO_LOCATIONS: Readonly<Record<string, string>> = {
  'amsterdam': 'Netherlands',
  'amsterdam-north-holland': 'Netherlands',
  'australia': 'Australia',
  'bangladesh': 'Bangladesh',
  'barcelona': 'Spain',
  'belgrade-central-serbia': 'Serbia',
  'bengaluru': 'India',
  'bengaluru-karnataka': 'India',
  'berlin': 'Germany',
  'boston-ma': 'United States',
  'brazil': 'Brazil',
  'bucharest-bucuresti': 'Romania',
  'canada': 'Canada',
  'chicago-il': 'United States',
  'costa-mesa-ca': 'United States',
  'cupertino-ca': 'United States',
  'denmark': 'Denmark',
  'finland': 'Finland',
  'france': 'France',
  'fremont-ca': 'United States',
  'georgia': 'Georgia',
  'germany': 'Germany',
  'hyderabad': 'India',
  'india': 'India',
  'krakow': 'Poland',
  'lisbon-lisbon-district': 'Portugal',
  'london-england': 'United Kingdom',
  'los-angeles-ca': 'United States',
  'madrid': 'Spain',
  'madrid-community-of-madrid': 'Spain',
  'mclean-va': 'United States',
  'menlo-park-ca': 'United States',
  'mexico': 'Mexico',
  'montreal-quebec': 'Canada',
  'mountain-view-ca': 'United States',
  'netherlands': 'Netherlands',
  'new-york-new-york': 'United States',
  'new-york-ny': 'United States',
  'palo-alto-ca': 'United States',
  'paris': 'France',
  'plano-tx': 'United States',
  'poland': 'Poland',
  'porto-oporto': 'Portugal',
  'portugal': 'Portugal',
  'pune': 'India',
  'saint-louis-missouri': 'United States',
  'san-francisco-ca': 'United States',
  'san-francisco-california': 'United States',
  'san-jose-ca': 'United States',
  'seattle-wa': 'United States',
  'seattle-washington': 'United States',
  'singapore': 'Singapore',
  'spain': 'Spain',
  'sunnyvale-ca': 'United States',
  'sydney': 'Australia',
  'tel-aviv-yafo': 'Israel',
  'toronto-on': 'Canada',
  'turkey': 'Turkey',
  'united-kingdom': 'United Kingdom',
  'united-states': 'United States',
  'valbonne': 'France',
  'warsaw-masovia': 'Poland',
  'washington-dc': 'United States',
};
const TARO_LOCATION_KEYS = Object.keys(TARO_LOCATIONS).sort((a, b) => b.length - a.length);

/**
 * Taro companies whose experiences are re-hosted Glassdoor reviews with their own city and date metadata: the place
 * on these pages is not the candidate's, so their sources show none.
 */
const TARO_UNRELIABLE_LOCATION = new Set(['bookingcom', 'revolut', 'tesla']);

const ROLE_WORDS: Readonly<Record<string, string>> = { '1': 'I', '2': 'II', '3': 'III', ii: 'II', iii: 'III', ui: 'UI', ml: 'ML', sde: 'SDE', ios: 'iOS', ai: 'AI', qa: 'QA', grc: 'GRC', seo: 'SEO', react: 'React' };

function taroRole(slug: string): string {
  const words = slug
    .replace(/engineerinternship/g, 'engineer-internship')
    .split('-')
    .map((word) => ROLE_WORDS[word] ?? word)
    .join(' ')
    .replace(/\bfront end\b/g, 'front-end')
    .replace(/\bfull stack\b/g, 'full-stack')
    // "Senior software engineer - Frontend" loses its dash in the slug; the qualifier goes back in brackets.
    .replace(/ (frontend|front-end|React)$/, ' ($1)');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function taroReporter(url: string): SourceReporter | null {
  const match = url.match(TARO_EXPERIENCE);
  if (!match) return null;
  const [, company, prefix, outcome] = match;
  const place = TARO_LOCATION_KEYS.find((key) => prefix.endsWith(`-${key}`));
  const roleSlug = place ? prefix.slice(0, -(place.length + 1)) : prefix;
  return {
    role: taroRole(roleSlug),
    ...(place && !TARO_UNRELIABLE_LOCATION.has(company) ? { location: TARO_LOCATIONS[place] } : {}),
    outcome: TARO_OUTCOMES[outcome],
  };
}

/** The reporter of an interview account: the fields its entry gives, else what a Taro URL carries. Official pages have none. */
export function sourceReporter(source: InterviewProcessSource): SourceReporter | null {
  if (source.kind === 'official') return null;
  const fromUrl = taroReporter(source.url);
  const role = source.role ?? fromUrl?.role;
  const location = source.location ?? fromUrl?.location;
  const outcome = source.outcome ?? fromUrl?.outcome;
  return { ...(role ? { role } : {}), ...(location ? { location } : {}), ...(outcome ? { outcome } : {}) };
}

/** "Senior software engineer, United States", "Candidate question bank". Null for official pages. */
export function describeReporter(source: InterviewProcessSource): string | null {
  if (source.kind === 'official') return null;
  if (source.reportForm === 'question-bank') return 'Candidate question bank';
  const reporter = sourceReporter(source);
  const role = reporter?.role ?? 'Role not stated';
  return reporter?.location ? `${role}, ${reporter.location}` : role;
}
