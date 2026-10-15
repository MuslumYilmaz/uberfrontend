const {
  isStudentEmailDomain,
  normalizeEmailDomain,
  resolveStudentEligibility,
} = require('../services/billing/student-eligibility');

describe('student email domain rule', () => {
  test('accepts edu, country edu and country ac domains at any depth', () => {
    for (const email of [
      'ada@mit.edu',
      'Ada@Mail.Stanford.EDU',
      'ada@boun.edu.tr',
      'ada@student.itu.edu.tr',
      'ada@ox.ac.uk',
      'ada@cs.ox.ac.uk',
      'ada@u-tokyo.ac.jp',
    ]) {
      expect(isStudentEmailDomain(email)).toBe(true);
    }
  });

  test('rejects look-alikes, consumer domains and malformed addresses', () => {
    for (const email of [
      'ada@gmail.com',
      'ada@edu.example.com',
      'ada@evil.edu.example.com',
      'ada@myedu.com',
      'ada@ac.example.org',
      'ada@education.org',
      'ada@',
      '@mit.edu',
      'mit.edu',
      '',
      null,
      undefined,
    ]) {
      expect(isStudentEmailDomain(email)).toBe(false);
    }
  });

  test('honours a reviewed allowlist by exact domain or subdomain', () => {
    const allowlist = ['uni-heidelberg.de'];
    expect(isStudentEmailDomain('ada@uni-heidelberg.de', allowlist)).toBe(true);
    expect(isStudentEmailDomain('ada@stud.uni-heidelberg.de', allowlist)).toBe(true);
    expect(isStudentEmailDomain('ada@uni-heidelberg.de.example.com', allowlist)).toBe(false);
    expect(isStudentEmailDomain('ada@uni-heidelberg.de')).toBe(false);
  });

  test('normalizes domains and rejects unsafe characters', () => {
    expect(normalizeEmailDomain('  Ada@Mail.Stanford.EDU. ')).toBe('mail.stanford.edu');
    expect(normalizeEmailDomain('ada@mit.edu/evil')).toBe('');
  });
});

describe('resolveStudentEligibility', () => {
  const now = new Date('2026-10-15T12:00:00.000Z');

  test('requires a verified school address', () => {
    expect(resolveStudentEligibility({ email: 'ada@mit.edu', emailVerifiedAt: new Date('2026-10-01') }, { now }))
      .toEqual({ eligible: true, reason: 'verified_student_domain' });
    expect(resolveStudentEligibility({ email: 'ada@mit.edu', emailVerifiedAt: null }, { now }))
      .toEqual({ eligible: false, reason: 'unverified_email' });
    expect(resolveStudentEligibility({ email: 'ada@gmail.com', emailVerifiedAt: new Date('2026-10-01') }, { now }))
      .toEqual({ eligible: false, reason: 'not_student_domain' });
    expect(resolveStudentEligibility({ email: '', emailVerifiedAt: new Date('2026-10-01') }, { now }))
      .toEqual({ eligible: false, reason: 'no_email' });
    expect(resolveStudentEligibility(null, { now })).toEqual({ eligible: false, reason: 'no_user' });
  });

  test('lets a support approval stand in for the domain rule, but not a future-dated one', () => {
    expect(resolveStudentEligibility({
      email: 'ada@gmail.com',
      emailVerifiedAt: null,
      billing: { studentApprovedAt: new Date('2026-10-10T00:00:00.000Z') },
    }, { now })).toEqual({ eligible: true, reason: 'approved_by_support' });
    expect(resolveStudentEligibility({
      email: 'ada@gmail.com',
      emailVerifiedAt: new Date('2026-10-01'),
      billing: { studentApprovedAt: new Date('2026-11-01T00:00:00.000Z') },
    }, { now })).toEqual({ eligible: false, reason: 'not_student_domain' });
    expect(resolveStudentEligibility({
      email: 'ada@gmail.com',
      billing: { studentApprovedAt: 'not a date' },
    }, { now })).toEqual({ eligible: false, reason: 'not_student_domain' });
  });
});
