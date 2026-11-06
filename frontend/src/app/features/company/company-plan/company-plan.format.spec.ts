import rawPlanData from '../../../../../../cdn/questions/company-plan-data.json';
import type { CompanyPlanAnswers } from '../../../core/models/company-plan.model';
import { CompanyPlanData, PlannedTask, buildCompanyPlan } from './company-plan.engine';
import { companyPlanPricingCopy, companySetLine, nextRoundName, planDateChip, planDatePassed, planFrameworkChips, planFrameworkLine, planPricingSource, practiceState, previewQueryParams, roundSourcesLine, whyLine, whyLineFor, hoursText } from './company-plan.format';

const DATA = rawPlanData as unknown as CompanyPlanData;

describe('previewQueryParams', () => {
  it('carries the companies, their lists, the date, the level, the passed rounds and a chosen framework, leaving out what is empty', () => {
    expect(previewQueryParams({ companies: [{ slug: 'agoda', list: 'gurgaon' }, { slug: 'meta' }], when: 'later', level: 'staff' }))
      .toEqual({ companies: 'agoda,meta', lists: 'agoda:gurgaon', when: 'later', level: 'staff' });
    expect(previewQueryParams({ companies: [{ slug: 'meta' }], when: 'later', level: 'staff', framework: 'angular' }))
      .toEqual({ companies: 'meta', when: 'later', level: 'staff', framework: 'angular' });
    expect(previewQueryParams({ companies: [{ slug: 'amazon' }], when: 'tomorrow', level: 'junior', passedRounds: ['amazon/experienced/online-assessment', 'amazon/experienced/phone-screen'] }))
      .toEqual({ companies: 'amazon', when: 'tomorrow', level: 'junior', passed: 'amazon/experienced/online-assessment,amazon/experienced/phone-screen' });
    expect(previewQueryParams({ companies: [{ slug: 'amazon' }], when: 'tomorrow', level: 'junior', passedRounds: [] })['passed']).toBeUndefined();
  });
});

describe('planFrameworkLine', () => {
  const plan = (answers: CompanyPlanAnswers) => buildCompanyPlan(DATA, {
    companies: answers.companies.map((company) => company.slug),
    when: answers.when,
    level: answers.level,
    ...(answers.framework ? { framework: answers.framework } : {}),
    today: '2026-11-05',
  });

  it('says where the framework comes from and offers the other three, with a way back once one was chosen', () => {
    const reports = planFrameworkLine(plan({ companies: [{ slug: 'elevenlabs' }], when: 'next-week', level: 'senior' }));
    expect(reports.text).toBe('UI tasks follow React, the framework in the reports.');
    expect(reports.options).toEqual([{ framework: 'angular', label: 'Use Angular' }, { framework: 'vue', label: 'Use Vue' }]);

    const chosen = planFrameworkLine(plan({ companies: [{ slug: 'elevenlabs' }], when: 'next-week', level: 'senior', framework: 'angular' }));
    expect(chosen.text).toBe('Tasks with an Angular version, and the extra practice, follow Angular, your choice; the rest stay as reported.');
    expect(planFrameworkLine(plan({ companies: [{ slug: 'elevenlabs' }], when: 'next-week', level: 'senior', framework: 'vue' })).text)
      .toBe('Tasks with a Vue version, and the extra practice, follow Vue, your choice; the rest stay as reported.');
    expect(chosen.options.map((option) => option.label)).toEqual(['Use React', 'Use Vue', 'Back to the reports']);
    expect(chosen.options[2].framework).toBeNull();

    expect(planFrameworkLine(plan({ companies: [{ slug: 'google' }], when: 'later', level: 'mid' })).text).toBe('The reports name no framework, so the tasks are in JavaScript and the UI builds in React.');
    const mixed = planFrameworkLine(plan({ companies: [{ slug: 'elevenlabs' }, { slug: 'google' }], when: 'later', level: 'mid' }));
    expect(mixed.text).toBe("UI tasks follow the framework in each company's reports.");
    expect(mixed.options.map((option) => option.framework)).toEqual(['react', 'angular', 'vue']);
  });

  it('chips a chosen framework as the choice it is, and a reported one as from the reports', () => {
    expect(planFrameworkChips(plan({ companies: [{ slug: 'elevenlabs' }], when: 'next-week', level: 'senior' }))).toEqual(['React, from reports']);
    expect(planFrameworkChips(plan({ companies: [{ slug: 'elevenlabs' }], when: 'next-week', level: 'senior', framework: 'vue' }))).toEqual(['Vue, your choice']);
    expect(planFrameworkChips(plan({ companies: [{ slug: 'google' }], when: 'later', level: 'mid' }))).toEqual(['JavaScript']);
  });
});

describe('whyLineFor', () => {
  it('names the round on an open row, and leaves format and general practice alone', () => {
    expect(whyLineFor({ kind: 'pick' }, 'Phone screen')).toBe('Our pick for the Phone screen');
    expect(whyLineFor({ kind: 'report', publisher: 'Taro', date: '2025-05' }, 'Phone screen')).toBe('Modelled on a report: Taro, May 2025 · Phone screen');
    expect(whyLineFor({ kind: 'format' }, 'Extra React practice')).toBe('Extra practice in the reported format');
    expect(whyLineFor({ kind: 'general' }, null)).toBe('General frontend practice');
    expect(whyLineFor({ kind: 'pick' }, null)).toBe('Our pick for this round');
  });

  it('names no round for a task the reports tie to none, wherever the plan placed it', () => {
    expect(whyLineFor({ kind: 'pick', unbound: true }, 'Phone screen')).toBe('Our pick for this plan');
    expect(whyLine({ kind: 'pick', unbound: true })).toBe('Our pick for this plan');
    expect(whyLineFor({ kind: 'report', publisher: 'Taro', date: '2024-11', unbound: true }, 'Onsite')).toBe('Modelled on a report: Taro, Nov 2024');
  });
});

describe('hoursText', () => {
  it('adds the listed minutes up in five-minute steps, never a quarter hour off', () => {
    expect(hoursText(200)).toBe('3 hours 20 minutes');
    expect(hoursText(195)).toBe('3 hours 15 minutes');
    expect(hoursText(60)).toBe('1 hour');
    expect(hoursText(45)).toBe('45 minutes');
    expect(hoursText(122)).toBe('2 hours');
  });
});

describe('nextRoundName', () => {
  const rounds = (passed: boolean[]) => ({ rounds: passed.map((value, index) => ({ name: `Round ${index + 1}`, passed: value })) as never });

  it('names the first round still ahead once something is passed', () => {
    expect(nextRoundName(rounds([false, false]))).toBeNull();
    expect(nextRoundName(rounds([true, false, false]))).toBe('Round 2');
    expect(nextRoundName(rounds([true, true]))).toBeNull();
  });
});

function copyFor(slug: string, data = DATA) {
  const answers: CompanyPlanAnswers = { companies: [{ slug }], when: 'next-week', level: 'senior' };
  const plan = buildCompanyPlan(data, { companies: [slug], when: answers.when, level: answers.level, today: '2026-11-02' });
  return companyPlanPricingCopy(data, answers, plan);
}

describe('companyPlanPricingCopy', () => {
  it('counts as open only the free tasks inside the plan', () => {
    expect(copyFor('elevenlabs').title).toBe('Your ElevenLabs plan is waiting');
    expect(copyFor('elevenlabs').summary).toMatch(/^6 tasks for next week, about \d+ hours?( \d+ minutes)?\. \d are open now, \d open with Premium\. Every round in order, with the tasks the reports describe and your progress\.$/);
    // A list of Premium-only candidates has every task locked; every real list now keeps an open task.
    const walmart = DATA.companies['walmart'];
    // Without the free guides too, since a people round with nothing else now gets its guide.
    const premiumOnly = {
      ...DATA,
      general: { ...DATA.general, guides: { people: '', design: '' } },
      companies: { walmart: { ...walmart, variants: walmart.variants.map((list) => ({ ...list, tasks: list.tasks.filter((row) => DATA.tasks[row.id]?.access === 'premium') })) } },
    } as CompanyPlanData;
    expect(copyFor('walmart', premiumOnly).summary).toMatch(/^6 tasks for next week, about \d+ hours?( \d+ minutes)?\. Every task opens with Premium\. Every round in order, with the tasks the reports describe and your progress\.$/);
    expect(copyFor('walmart').summary).toMatch(/^6 tasks for next week, about \d+ hours?( \d+ minutes)?\. [1-9] (is|are) open now, \d open with Premium\. Every round in order, with the tasks the reports describe and your progress\.$/);
    // Airbnb's table groups its rounds by type and gives no order.
    expect(copyFor('airbnb').summary).toMatch(/ Every round, with the tasks the reports describe and your progress\.$/);
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
