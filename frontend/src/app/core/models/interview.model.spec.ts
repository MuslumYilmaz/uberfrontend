import { interviewAvailabilityAllowsRole } from './interview.model';

describe('interviewAvailabilityAllowsRole', () => {
  it('allows authenticated user and admin roles during technical preflight', () => {
    const availability = { enabled: true, accessMode: 'preflight' as const };

    expect(interviewAvailabilityAllowsRole(availability, 'user')).toBeTrue();
    expect(interviewAvailabilityAllowsRole(availability, 'admin')).toBeTrue();
  });

  it('retains the internal admin-only contract', () => {
    const availability = { enabled: true, accessMode: 'internal' as const };

    expect(interviewAvailabilityAllowsRole(availability, 'user')).toBeFalse();
    expect(interviewAvailabilityAllowsRole(availability, 'admin')).toBeTrue();
  });

  it('fails closed when preflight is advertised as disabled', () => {
    expect(interviewAvailabilityAllowsRole({
      enabled: false,
      accessMode: 'preflight',
    }, 'user')).toBeFalse();
  });
});
