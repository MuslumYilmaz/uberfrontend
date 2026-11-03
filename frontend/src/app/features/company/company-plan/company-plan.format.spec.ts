import rawPlanData from '../../../../../../cdn/questions/company-plan-data.json';
import type { CompanyPlanAnswers } from '../../../core/models/company-plan.model';
import { CompanyPlanData, PlannedTask, buildCompanyPlan } from './company-plan.engine';
import { companyPlanPricingCopy, planDateChip, planDatePassed, practiceState, roundSourcesLine } from './company-plan.format';

const DATA = rawPlanData as unknown as CompanyPlanData;

function copyFor(slug: string, data = DATA) {
  const answers: CompanyPlanAnswers = { companies: [{ slug }], when: 'next-week', level: 'senior' };
  const plan = buildCompanyPlan(data, { companies: [slug], when: answers.when, level: answers.level, today: '2026-11-02' });
  return companyPlanPricingCopy(data, answers, plan);
}

describe('companyPlanPricingCopy', () => {
  it('counts as open only the free tasks inside the plan', () => {
    expect(copyFor('elevenlabs').title).toBe('Your ElevenLabs plan is waiting');
    expect(copyFor('elevenlabs').summary).toMatch(/^6 tasks for next week, about [\d.]+ hours?\. 3 are open now\. Premium opens the rest and keeps every round in order\.$/);
    // Walmart's free tasks all sit outside its plan.
    expect(copyFor('walmart').summary).toMatch(/^6 tasks for next week, about [\d.]+ hours?\. Premium opens them and keeps every round in order\.$/);
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
