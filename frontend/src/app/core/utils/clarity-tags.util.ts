import { isProActive, type EntitledUser } from './entitlements.util';
import { normalizePathname } from './marketing-route.util';

/** Coarse page family for the Clarity filters; URL filters keep the detail. */
export type ClarityPageGroup =
  | 'home'
  | 'pricing'
  | 'billing'
  | 'company'
  | 'coding'
  | 'questions'
  | 'system-design'
  | 'tradeoffs'
  | 'guides'
  | 'tracks'
  | 'interview'
  | 'tools'
  | 'auth'
  | 'account'
  | 'info'
  | 'other';

export type ClarityTier = 'guest' | 'free' | 'pro';

// The first URL segment the tech route matcher accepts (coding, trivia and debug detail pages).
const TECH_PREFIXES = new Set(['javascript', 'react', 'angular', 'vue', 'html', 'css', 'html-css']);

// Funnel events worth finding in recordings: pricing, checkout, premium gates, auth and company plans.
const CLARITY_EVENT_MIRROR = /^(?:pricing_|checkout_|premium_|auth_|company_plan_)|^(?:begin_checkout|sign_up|login)$/;

export function clarityPageGroupFor(url: string | null | undefined): ClarityPageGroup {
  const path = normalizePathname(url).toLowerCase();
  const [first = '', second = ''] = path.split('/').filter(Boolean);
  if (path === '/' || first === 'showcase') return 'home';

  if (TECH_PREFIXES.has(first)) {
    if (second === 'coding' || second === 'debug') return 'coding';
    if (second === 'trivia' || second === 'interview-questions') return 'questions';
    return 'other';
  }

  switch (first) {
    case 'pricing':
      return 'pricing';
    case 'billing':
      return 'billing';
    case 'companies':
      return 'company';
    case 'coding':
    case 'machine-coding':
    case 'code-reviews':
      return 'coding';
    case 'interview-questions':
      return 'questions';
    case 'system-design':
      return 'system-design';
    case 'incidents':
    case 'tradeoffs':
      return 'tradeoffs';
    case 'guides':
      return 'guides';
    case 'track':
    case 'tracks':
    case 'focus-areas':
      return 'tracks';
    case 'interview':
      return 'interview';
    case 'tools':
      return 'tools';
    case 'auth':
    case 'verify-email':
    case 'onboarding':
      return 'auth';
    case 'profile':
    case 'dashboard':
      return 'account';
    case 'legal':
    case 'changelog':
    case 'research':
    case 'about':
      return 'info';
    default:
      return 'other';
  }
}

/** Same rule as the premium guard: an active entitlement, the legacy tier, or the admin role. */
export function clarityTierFor(user: (EntitledUser & { role?: string }) | null | undefined): ClarityTier {
  if (!user) return 'guest';
  return user.role === 'admin' || isProActive(user) ? 'pro' : 'free';
}

export function shouldMirrorEventToClarity(name: string): boolean {
  return CLARITY_EVENT_MIRROR.test(name);
}
