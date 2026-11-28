import type { Entitlements } from '../models/user.model';
import {
  type ClarityPageGroup,
  clarityPageGroupFor,
  clarityTierFor,
  shouldMirrorEventToClarity,
} from './clarity-tags.util';

describe('clarity tags util', () => {
  it('maps URLs to the coarse page groups used as Clarity filters', () => {
    const cases: Array<[string, ClarityPageGroup]> = [
      ['', 'home'],
      ['/', 'home'],
      ['/showcase?utm_source=x', 'home'],
      ['/pricing', 'pricing'],
      ['/pricing/?src=company_plan_meta#plans', 'pricing'],
      ['/billing/success', 'billing'],
      ['/companies/elevenlabs/all', 'company'],
      ['/coding', 'coding'],
      ['/javascript/coding/throttle', 'coding'],
      ['/react/debug/invoice-bug-squash', 'coding'],
      ['/machine-coding', 'coding'],
      ['/javascript/trivia/js-escape-vs-sanitize', 'questions'],
      ['/react/interview-questions', 'questions'],
      ['/html-css/interview-questions', 'questions'],
      ['/interview-questions/essential', 'questions'],
      ['/system-design/hotel-search', 'system-design'],
      ['/incidents/autosave-overwrites-draft', 'tradeoffs'],
      ['/tradeoffs', 'tradeoffs'],
      ['/guides/playbook/resume', 'guides'],
      ['/tracks/react/mastery', 'tracks'],
      ['/focus-areas', 'tracks'],
      ['/interview/abc123/results', 'interview'],
      ['/tools/cv-linter', 'tools'],
      ['/auth/login', 'auth'],
      ['/verify-email', 'auth'],
      ['/onboarding/quick-start', 'auth'],
      ['/profile', 'account'],
      ['/dashboard', 'account'],
      ['/legal/cookies', 'info'],
      ['/changelog', 'info'],
      ['/research/angular-onpush-readiness', 'info'],
      ['/javascript', 'other'],
      ['/404', 'other'],
    ];
    for (const [url, group] of cases) {
      expect(clarityPageGroupFor(url)).withContext(url).toBe(group);
    }
  });

  it('derives the tier from the pro entitlement, the legacy access tier and the admin role', () => {
    const entitlements = (status: Entitlements['pro']['status']): Entitlements => ({
      pro: { status, validUntil: null },
      projects: { status: 'none', validUntil: null },
    });

    expect(clarityTierFor(null)).toBe('guest');
    expect(clarityTierFor(undefined)).toBe('guest');
    expect(clarityTierFor({ role: 'user' })).toBe('free');
    expect(clarityTierFor({ role: 'user', accessTier: 'premium' })).toBe('pro');
    expect(clarityTierFor({ role: 'user', entitlements: entitlements('active') })).toBe('pro');
    expect(clarityTierFor({ role: 'user', entitlements: entitlements('expired'), accessTier: 'premium' })).toBe('free');
    expect(clarityTierFor({ role: 'admin' })).toBe('pro');
  });

  it('mirrors funnel events only', () => {
    for (const name of [
      'pricing_viewed',
      'pricing_plan_cta_clicked',
      'checkout_opened',
      'begin_checkout',
      'premium_gate_path_clicked',
      'auth_prompt',
      'auth_submit_failed',
      'sign_up',
      'login',
      'company_plan_build_clicked',
    ]) {
      expect(shouldMirrorEventToClarity(name)).withContext(name).toBeTrue();
    }
    for (const name of [
      'trivia_lab_viewed',
      'header_study_opened',
      'xp_awarded',
      'guide_scroll_depth',
      'decision_session_qualified',
      'login_failed',
      'page_view',
    ]) {
      expect(shouldMirrorEventToClarity(name)).withContext(name).toBeFalse();
    }
  });
});
