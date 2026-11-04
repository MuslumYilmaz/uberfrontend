import rawPlanData from '../../../../../../cdn/questions/company-plan-data.json';
import type { CompanyPlanAnswers } from '../../../core/models/company-plan.model';
import { CompanyPlanData, PlannedTask, buildCompanyPlan } from './company-plan.engine';
import { companyPlanPricingCopy, companySetLine, planDateChip, planDatePassed, planPricingSource, practiceState, roundSourcesLine } from './company-plan.format';

const DATA = rawPlanData as unknown as CompanyPlanData;

function copyFor(slug: string, data = DATA) {
  const answers: CompanyPlanAnswers = { companies: [{ slug }], when: 'next-week', level: 'senior' };
  const plan = buildCompanyPlan(data, { companies: [slug], when: answers.when, level: answers.level, today: '2026-11-02' });
  return companyPlanPricingCopy(data, answers, plan);
}

describe('companyPlanPricingCopy', () => {
  it('counts as open only the free tasks inside the plan', () => {
    expect(copyFor('elevenlabs').title).toBe('Your ElevenLabs plan is waiting');
    expect(copyFor('elevenlabs').summary).toMatch(/^6 tasks for next week, about [\d.]+ hours?\. \d are open now, \d open with Premium\. Every round in order, with its tasks and your progress\.$/);
    // Walmart's free tasks all sit outside its plan.
    expect(copyFor('walmart').summary).toMatch(/^6 tasks for next week, about [\d.]+ hours?\. Every task opens with Premium\. Every round in order, with its tasks and your progress\.$/);
  });

  it('points at the month, with the reason, when the interview is within two weeks, and at the quarter otherwise', () => {
    expect(copyFor('elevenlabs')).toEqual(jasmine.objectContaining({ note: 'Your interview is next week, so a month of Premium is enough.', recommendedPlan: 'monthly' }));
    const later = companyPlanPricingCopy(DATA, { companies: [{ slug: 'elevenlabs' }], when: 'later', level: 'senior' },
      buildCompanyPlan(DATA, { companies: ['elevenlabs'], when: 'later', level: 'senior', today: '2026-11-02' }));
    expect(later).toEqual(jasmine.objectContaining({ note: '', recommendedPlan: 'quarterly' }));
    const soon = companyPlanPricingCopy(DATA, { companies: [{ slug: 'elevenlabs' }], when: 'tomorrow', level: 'senior' },
      buildCompanyPlan(DATA, { companies: ['elevenlabs'], when: 'tomorrow', level: 'senior', today: '2026-11-02' }));
    expect(soon.note).toBe('Your interview is tomorrow, so a month of Premium is enough.');
    expect(soon.recommendedPlan).toBe('monthly');
  });

  it('promises a live preview for framework tasks and tests for JavaScript, never checks', () => {
    const counts = DATA.general.premiumCounts;
    expect(copyFor('elevenlabs').lead).toEqual([
      'Your full ElevenLabs plan',
      `${counts.react} Premium React tasks with a live preview`,
      `${counts.systemDesign} Premium system design walkthroughs`,
    ]);
    expect(copyFor('meta').lead[1]).toBe(`${counts.javascript} Premium JavaScript tasks with browser tests`);
    for (const line of [...copyFor('elevenlabs').lead, ...copyFor('meta').lead]) expect(line).not.toMatch(/check/i);
  });

  it('leaves the counts out when the data predates them', () => {
    const old = { ...DATA, general: { ...DATA.general, premiumCounts: undefined } } as unknown as CompanyPlanData;
    expect(copyFor('elevenlabs', old).lead).toEqual(['Your full ElevenLabs plan']);
  });
});

describe('companySetLine', () => {
  it('splits one company set by kind and leaves out a kind it lacks', () => {
    expect(companySetLine([{ name: 'Amazon', counts: { all: 42, coding: 18, trivia: 23, system: 1 } }]))
      .toBe('The full Amazon set: 42 questions (18 coding, 23 concept, 1 system design)');
    expect(companySetLine([{ name: 'Google', counts: { all: 45, coding: 14, trivia: 31, system: 0 } }]))
      .toBe('The full Google set: 45 questions (14 coding, 31 concept)');
  });

  it('lists several sets side by side and skips a company without one', () => {
    expect(companySetLine([
      { name: 'Netflix', counts: { all: 13, coding: 7, trivia: 6, system: 0 } },
      { name: 'Acme', counts: undefined },
      { name: 'Spotify', counts: { all: 13, coding: 4, trivia: 9, system: 0 } },
    ])).toBe('The full sets: 13 Netflix and 13 Spotify questions');
    expect(companySetLine([{ name: 'Acme', counts: { all: 0, coding: 0, trivia: 0, system: 0 } }])).toBe('');
  });
});

describe('planPricingSource', () => {
  it('names the company with underscores, as the guides do, and a plan without one as general', () => {
    expect(planPricingSource('capital-one')).toBe('company_plan_capital_one');
    expect(planPricingSource('elevenlabs')).toBe('company_plan_elevenlabs');
    expect(planPricingSource(undefined)).toBe('company_plan_general');
  });
});

describe('the interview date of a plan', () => {
  // Local times: Monday 2 November 2026 and Sunday 8 November 2026.
  const monday = new Date(2026, 10, 2, 10).toISOString();
  const sunday = new Date(2026, 10, 8, 22).toISOString();

  it('names the week, the day or no date, from when the answers were given', () => {
    expect(planDateChip('next-week', monday)).toBe('Week of Nov 9');
    expect(planDateChip('this-week', sunday)).toBe('Week of Nov 2');
    expect(planDateChip('tomorrow', monday)).toBe('Nov 3');
    expect(planDateChip('later', monday)).toBe('No date yet');
  });

  it('passes only once the whole week or day is over', () => {
    expect(planDatePassed('next-week', monday, new Date(2026, 10, 15, 23, 59))).toBeFalse();
    expect(planDatePassed('next-week', monday, new Date(2026, 10, 16, 0, 0))).toBeTrue();
    expect(planDatePassed('tomorrow', monday, new Date(2026, 10, 3, 23, 59))).toBeFalse();
    expect(planDatePassed('tomorrow', monday, new Date(2026, 10, 4, 0, 0))).toBeTrue();
    expect(planDatePassed('later', monday, new Date(2030, 0, 1))).toBeFalse();
  });
});

describe('round sources and task links', () => {
  it('names the sources and counts the rest', () => {
    const sources = [{ label: 'Aced', date: '2026-07' }, { label: 'LeetCode', date: '2025-11' }];
    expect(roundSourcesLine({ sources })).toBe('Reported in Aced Jul 2026 and LeetCode Nov 2025');
    expect(roundSourcesLine({ sources, moreSources: 2 })).toBe('Reported in Aced Jul 2026, LeetCode Nov 2025 and 2 more');
    expect(roundSourcesLine({ sources: [] })).toBe('');
  });

  it('gives practice the way back and Next, a walkthrough only the way back, and a guide nothing', () => {
    const task = (id: string, kind: PlannedTask['kind'], tech?: string) => ({ id, kind, tech } as PlannedTask);
    const tasks = [task('js-poll-until', 'coding', 'javascript'), task('ai-review', 'system-design'), task('behavioral', 'guide'), task('closures', 'trivia', 'javascript')];
    expect(practiceState(tasks[3], tasks, '/companies/plan', 'Back to plan')).toEqual({
      session: { items: [{ tech: 'javascript', kind: 'coding', id: 'js-poll-until' }, { tech: 'javascript', kind: 'trivia', id: 'closures' }], index: 1 },
      returnToUrl: '/companies/plan',
      returnLabel: 'Back to plan',
    });
    expect(practiceState(tasks[1], tasks, '/companies/plan', 'Back to plan')).toEqual({ returnToUrl: '/companies/plan', returnLabel: 'Back to plan' });
    expect(practiceState(tasks[2], tasks, '/companies/plan', 'Back to plan')).toEqual({});
  });
});
