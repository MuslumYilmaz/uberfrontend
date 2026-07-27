'use strict';

const {
  monthKeyInTimezone,
  nextMonthResetAt,
  quotaExpiresAt,
} = require('../services/interview/quota');
const InterviewMonthlyQuota = require('../models/InterviewMonthlyQuota');

describe('Interview monthly quota calendar', () => {
  test('uses the Europe/Istanbul month boundary instead of the UTC boundary', () => {
    expect(monthKeyInTimezone(new Date('2026-07-31T20:59:59.999Z'))).toBe('2026-07');
    expect(monthKeyInTimezone(new Date('2026-07-31T21:00:00.000Z'))).toBe('2026-08');
    expect(nextMonthResetAt('2026-07').toISOString()).toBe('2026-07-31T21:00:00.000Z');
  });

  test('rolls a December quota window into January of the next year', () => {
    expect(nextMonthResetAt('2026-12').toISOString()).toBe('2026-12-31T21:00:00.000Z');
  });

  test('retains a closed month for a bounded audit window', () => {
    expect(quotaExpiresAt('2026-07').toISOString()).toBe('2026-10-29T21:00:00.000Z');
    expect(InterviewMonthlyQuota.schema.indexes()).toEqual(expect.arrayContaining([
      [
        { expiresAt: 1 },
        expect.objectContaining({
          expireAfterSeconds: 0,
          name: 'ttl_interview_quota_retention',
        }),
      ],
    ]));
  });
});
