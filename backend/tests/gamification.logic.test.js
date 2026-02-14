'use strict';

const {
  applyChallengeStreak,
  readActiveActivityStreakCurrent,
} = require('../services/gamification/engine');
const { weekBoundsFromDayKey, dayDiffByKey } = require('../services/gamification/timezone');
const {
  resolveDailyChallengeTechPreference,
  selectDailyChallengeQuestion,
} = require('../services/gamification/daily-challenge');

describe('gamification logic', () => {
  test('challenge streak increments on consecutive days', () => {
    const first = applyChallengeStreak(
      { current: 2, longest: 4, lastCompletedLocalDate: '2026-02-08' },
      '2026-02-09'
    );

    expect(first.incremented).toBe(true);
    expect(first.broken).toBe(false);
    expect(first.next.current).toBe(3);
    expect(first.next.longest).toBe(4);
  });

  test('challenge streak resets after missed day and marks broken', () => {
    const out = applyChallengeStreak(
      { current: 5, longest: 7, lastCompletedLocalDate: '2026-02-05' },
      '2026-02-09'
    );

    expect(out.incremented).toBe(true);
    expect(out.broken).toBe(true);
    expect(out.next.current).toBe(1);
    expect(out.next.longest).toBe(7);
  });

  test('activity streak summary returns 0 after at least one missed day', () => {
    const active = readActiveActivityStreakCurrent(
      { current: 4, longest: 7, lastActiveUTCDate: '2026-02-07' },
      '2026-02-09'
    );

    expect(active).toBe(0);
  });

  test('activity streak summary keeps value when last activity was yesterday', () => {
    const active = readActiveActivityStreakCurrent(
      { current: 4, longest: 7, lastActiveUTCDate: '2026-02-08' },
      '2026-02-09'
    );

    expect(active).toBe(4);
  });

  test('week bounds use monday to sunday', () => {
    const bounds = weekBoundsFromDayKey('2026-02-11'); // Wednesday
    expect(bounds.startDayKey).toBe('2026-02-09');
    expect(bounds.endDayKey).toBe('2026-02-15');
    expect(bounds.weekKey).toBe('2026-02-09');
  });

  test('day key diff is deterministic', () => {
    expect(dayDiffByKey('2026-02-08', '2026-02-09')).toBe(1);
    expect(dayDiffByKey('2026-02-09', '2026-02-09')).toBe(0);
    expect(dayDiffByKey('2026-02-10', '2026-02-09')).toBe(-1);
  });

  test('explicit preferred tech is used when available', () => {
    const catalog = { byId: new Map() };
    const user = {
      prefs: { gamification: { dailyChallengeTech: 'react' } },
      solvedQuestionIds: ['vue-a'],
    };

    const tech = resolveDailyChallengeTechPreference(user, catalog);
    expect(tech).toBe('react');
  });

  test('auto preferred tech infers from solved history', () => {
    const catalog = {
      byId: new Map([
        ['r1', { tech: 'react' }],
        ['r2', { tech: 'react' }],
        ['v1', { tech: 'vue' }],
      ]),
    };
    const user = {
      prefs: { gamification: { dailyChallengeTech: 'auto' } },
      solvedQuestionIds: ['v1', 'r1', 'r2'],
    };

    const tech = resolveDailyChallengeTechPreference(user, catalog);
    expect(tech).toBe('react');
  });

  test('selection falls back to global pool when preferred tech has no candidates', () => {
    const selected = selectDailyChallengeQuestion({
      basePool: [
        { id: 'js-1', tech: 'javascript' },
        { id: 'vue-1', tech: 'vue' },
      ],
      dayKey: '2026-02-09',
      userId: 'u1',
      preferredTech: 'angular',
      recentIds: new Set(),
    });

    expect(['js-1', 'vue-1']).toContain(selected.id);
  });

  test('selection is deterministic for same day/user/tech', () => {
    const params = {
      basePool: [
        { id: 'react-1', tech: 'react' },
        { id: 'react-2', tech: 'react' },
        { id: 'react-3', tech: 'react' },
      ],
      dayKey: '2026-02-09',
      userId: 'u42',
      preferredTech: 'react',
      recentIds: new Set(['react-2']),
    };
    const first = selectDailyChallengeQuestion(params);
    const second = selectDailyChallengeQuestion(params);

    expect(first.id).toBe(second.id);
  });
});
