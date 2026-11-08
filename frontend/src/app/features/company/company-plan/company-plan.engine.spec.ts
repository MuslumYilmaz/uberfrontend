import rawPlanData from '../../../../../../cdn/questions/company-plan-data.json';
import type { CompanyPlanLevel } from '../../../shared/company-previews/company-plan-rounds';
import {
  COMPANY_PLAN_BUDGETS,
  COMPANY_PLAN_DESIGN_CAPS,
  CompanyPlan,
  CompanyPlanData,
  CompanyPlanDataRow,
  CompanyPlanDataTask,
  CompanyPlanInput,
  CompanyPlanWhen,
  buildCompanyPlan,
  companyPlanDefaultList,
  companyPlanRoundKey,
} from './company-plan.engine';

const REAL_DATA = rawPlanData as unknown as CompanyPlanData;
const TODAY = '2026-11-02';
const WHENS = Object.keys(COMPANY_PLAN_BUDGETS) as CompanyPlanWhen[];
const LEVELS = Object.keys(COMPANY_PLAN_DESIGN_CAPS) as CompanyPlanLevel[];

const task = (id: string, overrides: Partial<CompanyPlanDataTask> = {}): CompanyPlanDataTask => ({
  id,
  title: id,
  route: `/javascript/coding/${id}`,
  kind: 'coding',
  tech: 'javascript',
  access: 'free',
  minutes: 30,
  ...overrides,
});

const round = (id: string, kinds: readonly ('recruiter' | 'coding' | 'design' | 'people' | 'outcome' | 'other')[], extra: object = {}) => ({
  id,
  name: id,
  kinds,
  note: `${id} note.`,
  sources: [],
  ...extra,
});

const FIXTURE_TASKS = [
  task('reported-new'),
  task('reported-old', { access: 'premium' }),
  task('linked'),
  task('tagged-a'),
  task('tagged-b'),
  task('concept', { kind: 'trivia', route: '/javascript/trivia/concept', minutes: 10 }),
  task('design-a', { kind: 'system-design', route: '/system-design/design-a', tech: undefined, access: 'premium', minutes: 45 }),
  task('design-b', { kind: 'system-design', route: '/system-design/design-b', tech: undefined, minutes: 45 }),
  task('format-a', { access: 'premium' }),
  task('format-b', { access: 'premium' }),
  task('starter-free'),
  task('starter-premium', { access: 'premium' }),
  task('starter-free-2'),
  task('starter-free-3'),
  task('/guides/people', { kind: 'guide', route: '/guides/people', tech: undefined, minutes: 15 }),
  task('/guides/design', { kind: 'guide', route: '/guides/design', tech: undefined, minutes: 15 }),
  task('widget-react', { tech: 'react', family: 'widget', route: '/react/coding/widget-react' }),
  task('widget-angular', { tech: 'angular', family: 'widget', route: '/angular/coding/widget-angular', access: 'premium' }),
  task('format-ng', { tech: 'angular', route: '/angular/coding/format-ng', access: 'premium' }),
];

function fixture(rows: readonly CompanyPlanDataRow[], rounds: readonly object[], extra: object = {}): CompanyPlanData {
  return {
    schemaVersion: 1,
    general: {
      starters: ['starter-free', 'starter-premium', 'starter-free-2', 'starter-free-3'],
      formatPractice: { react: ['format-a', 'format-b'], angular: ['format-ng', 'format-b'], vue: ['format-a', 'format-b'], javascript: ['format-a', 'format-b'] },
      guides: { people: '/guides/people', design: '/guides/design' },
      familyMembers: { widget: { react: 'widget-react', angular: 'widget-angular' } },
    },
    tasks: Object.fromEntries(FIXTURE_TASKS.map((entry) => [entry.id, entry])),
    companies: {
      acme: {
        name: 'Acme',
        signature: 'Coding',
        framework: 'javascript',
        checkedAt: '2026-10-20',
        variants: [{ id: 'main', title: 'Engineers', sourceCount: 3, rounds, tasks: rows, ...extra }],
      },
    },
  } as unknown as CompanyPlanData;
}

const input = (overrides: Partial<CompanyPlanInput> = {}): CompanyPlanInput => ({
  companies: ['acme'],
  when: 'next-week',
  level: 'senior',
  today: TODAY,
  ...overrides,
});

const idsIn = (plan: CompanyPlan, roundId: string) => plan.companies[0].rounds.find((entry) => entry.id === roundId)?.tasks.map((entry) => entry.id) ?? [];
const report = { publisher: 'Taro', date: '2026-01' };

describe('company plan engine', () => {
  describe('on the real data, for every company, list, date and level', () => {
    for (const [slug, company] of Object.entries(REAL_DATA.companies)) {
      it(slug, () => {
        for (const list of company.variants) {
          for (const when of WHENS) {
            for (const level of LEVELS) {
              const where = `${slug}/${list.id}/${when}/${level}`;
              const plan = buildCompanyPlan(REAL_DATA, { companies: [slug], lists: { [slug]: list.id }, when, level, today: TODAY });

              expect(plan.tasks.length).withContext(`${where}: empty plan`).toBeGreaterThan(0);
              expect(plan.tasks.length).withContext(`${where}: over budget`).toBeLessThanOrEqual(COMPANY_PLAN_BUDGETS[when].total);
              expect(new Set(plan.tasks.map((entry) => entry.id)).size).withContext(`${where}: repeated task`).toBe(plan.tasks.length);

              const families = plan.tasks.flatMap((entry) => (entry.family ? [entry.family] : []));
              expect(new Set(families).size).withContext(`${where}: repeated family`).toBe(families.length);

              const expectedTech = company.framework === 'javascript' ? 'react' : company.framework;
              for (const entry of plan.tasks) {
                if (entry.tech && ['react', 'angular', 'vue'].includes(entry.tech)) expect(entry.tech).withContext(`${where}: ${entry.id}`).toBe(expectedTech);
              }

              const designs = plan.tasks.filter((entry) => entry.kind === 'system-design').length;
              expect(designs).withContext(`${where}: design cap`).toBeLessThanOrEqual(COMPANY_PLAN_DESIGN_CAPS[level]);

              expect(plan.preview.open.length).withContext(`${where}: preview`).toBe(3);
              for (const entry of plan.preview.open) {
                expect(entry.access).withContext(`${where}: ${entry.id}`).toBe('free');
                expect(entry.kind).withContext(`${where}: ${entry.id}`).not.toBe('guide');
              }
              const openIds = new Set(plan.preview.open.map((entry) => entry.id));
              expect(plan.preview.rest.every((entry) => !openIds.has(entry.id))).withContext(`${where}: rest repeats preview`).toBeTrue();

              const rows = new Map(list.tasks.map((row) => [row.id, row]));
              for (const entry of plan.tasks) {
                if (entry.why.kind === 'report') expect(rows.get(entry.id)?.report).withContext(`${where}: ${entry.id} has no report`).toBeDefined();
              }
              // A rehearsal stands for its problems, so none of them sits beside it.
              const members = new Set(plan.tasks.flatMap((entry) => entry.members ?? []));
              expect(plan.tasks.filter((entry) => members.has(entry.id)).map((entry) => entry.id)).withContext(`${where}: a rehearsal beside its problem`).toEqual([]);

              if (when === 'tomorrow') {
                expect(plan.tasks.some((entry) => entry.access === 'premium')).withContext(`${where}: no Premium task`).toBeTrue();
              }
              // Something to try without paying, in every plan: no "0 open now".
              expect(plan.tasks.some((entry) => entry.access === 'free' && entry.kind !== 'guide')).withContext(`${where}: no open task`).toBeTrue();

              expect(plan.totalMinutes).withContext(where).toBe(plan.tasks.reduce((sum, entry) => sum + entry.minutes, 0));
              expect(buildCompanyPlan(REAL_DATA, { companies: [slug], lists: { [slug]: list.id }, when, level, today: TODAY })).withContext(`${where}: not repeatable`).toEqual(plan);
            }
          }
        }
      });
    }

    it('fills the Next week budget for the list every level opens on', () => {
      for (const [slug, company] of Object.entries(REAL_DATA.companies)) {
        for (const level of LEVELS) {
          const plan = buildCompanyPlan(REAL_DATA, { companies: [slug], when: 'next-week', level, today: TODAY });
          expect(plan.tasks.length).withContext(`${slug}/${level}`).toBe(COMPANY_PLAN_BUDGETS['next-week'].total);
          expect(plan.companies[0].list.id).withContext(`${slug}/${level}`).toBe(companyPlanDefaultList(company).id);
        }
      }
    });

    it('never repeats a task or a family across companies', () => {
      const slugs = Object.keys(REAL_DATA.companies);
      slugs.forEach((slug, index) => {
        const trio = [slug, slugs[(index + 1) % slugs.length], slugs[(index + 7) % slugs.length]];
        for (const when of WHENS) {
          const plan = buildCompanyPlan(REAL_DATA, { companies: trio, when, level: 'senior', today: TODAY });
          expect(plan.tasks.length).withContext(`${trio.join('+')}/${when}`).toBeLessThanOrEqual(COMPANY_PLAN_BUDGETS[when].total);
          expect(new Set(plan.tasks.map((entry) => entry.id)).size).withContext(`${trio.join('+')}/${when}`).toBe(plan.tasks.length);
          const families = plan.tasks.flatMap((entry) => (entry.family ? [entry.family] : []));
          expect(new Set(families).size).withContext(`${trio.join('+')}/${when}`).toBe(families.length);
          const withTasks = plan.companies.filter((company) => company.rounds.some((entry) => entry.tasks.length)).length;
          expect(withTasks).withContext(`${trio.join('+')}/${when}: a company got nothing`).toBe(3);
        }
      });
    });
  });

  it('opens a round with its timed rehearsal and keeps the rehearsal\'s problems out beside it', () => {
    const rehearsal = task('rehearsal-coding', { kind: 'rehearsal', tech: undefined, access: 'premium', minutes: 40, members: ['linked', 'tagged-a'] });
    const base = fixture(
      [{ id: 'linked', rounds: ['coding'], lead: true }, { id: 'tagged-a', rounds: ['coding'], report }, { id: 'tagged-b', rounds: ['coding'] }, { id: rehearsal.id, rounds: ['coding'] }],
      [round('screen', ['recruiter']), round('coding', ['coding'])],
    );
    const data = { ...base, tasks: { ...base.tasks, [rehearsal.id]: rehearsal } } as CompanyPlanData;
    const plan = buildCompanyPlan(data, input({ when: 'later' }));

    expect(idsIn(plan, 'coding')[0]).toBe('rehearsal-coding');
    expect(idsIn(plan, 'coding')).toContain('tagged-b');
    expect(plan.tasks.map((entry) => entry.id)).not.toContain('linked');
    expect(plan.tasks.map((entry) => entry.id)).not.toContain('tagged-a');
    expect(plan.tasks.find((entry) => entry.id === rehearsal.id)?.why).toEqual({ kind: 'rehearsal', problems: 2 });

    // A rehearsal that opens with questions carries their counts, by kind, to its line.
    const screen = { ...rehearsal, shortAnswers: 8, choiceQuestions: 2 };
    const withQuestions = buildCompanyPlan({ ...data, tasks: { ...data.tasks, [rehearsal.id]: screen } } as CompanyPlanData, input({ when: 'later' }));
    expect(withQuestions.tasks.find((entry) => entry.id === rehearsal.id)?.why)
      .toEqual({ kind: 'rehearsal', problems: 2, shortAnswers: 8, choiceQuestions: 2 });
  });

  it('lets a rehearsal that holds none of its round\'s practice links follow the link, as one format among several', () => {
    // Walmart's coding screen: the guide links a React task, and the Karat rehearsal holds two other problems.
    const rehearsal = task('rehearsal-screen', { kind: 'rehearsal', tech: undefined, access: 'premium', minutes: 55, members: ['tagged-a', 'tagged-b'], shortAnswers: 8 });
    const base = fixture(
      [{ id: 'linked', rounds: ['coding'], lead: true }, { id: rehearsal.id, rounds: ['coding'] }, { id: 'reported-new', rounds: ['onsite'], report }],
      [round('screen', ['recruiter']), round('coding', ['coding']), round('onsite', ['coding'])],
    );
    const data = { ...base, tasks: { ...base.tasks, [rehearsal.id]: rehearsal } } as CompanyPlanData;
    expect(idsIn(buildCompanyPlan(data, input({ when: 'later' })), 'coding')).toEqual(['linked', 'rehearsal-screen']);

    // One that holds the link is the round itself, and opens it.
    const holding = { ...rehearsal, members: ['linked', 'tagged-b'] };
    const opened = buildCompanyPlan({ ...data, tasks: { ...data.tasks, [rehearsal.id]: holding } } as CompanyPlanData, input({ when: 'later' }));
    expect(idsIn(opened, 'coding')[0]).toBe('rehearsal-screen');
    expect(idsIn(opened, 'coding')).not.toContain('linked');
  });

  it('gives the format share to the open tasks of the round the person faces next', () => {
    const data = fixture(
      [
        { id: 'reported-old', rounds: ['squash'], report, lead: true },
        { id: 'tagged-a', rounds: ['squash'], report },
        { id: 'linked', rounds: ['integration'], lead: true },
        { id: 'tagged-b', rounds: ['exercise'], lead: true },
      ],
      [
        round('screen', ['recruiter']),
        round('squash', ['coding'], { name: 'Onsite: squash' }),
        round('integration', ['coding'], { name: 'Onsite: integration' }),
        round('exercise', ['coding'], { name: 'Onsite: exercise' }),
      ],
    );
    const plan = buildCompanyPlan(data, input({ when: 'this-week', level: 'mid' }));

    // The onsite day takes a task per round; the squash round the person faces first then gets its open task before
    // a format task no report names.
    expect(idsIn(plan, 'squash')).toEqual(['reported-old', 'tagged-a']);
    expect(plan.formatPractice).toEqual([]);
  });

  it('names the framework of its extra practice', () => {
    const data = fixture([{ id: 'linked', rounds: ['coding'], lead: true }], [round('coding', ['coding'])]);
    expect(buildCompanyPlan(data, input()).formatPractice.map((entry) => entry.why)).toEqual([
      { kind: 'format', framework: 'javascript' },
      { kind: 'format', framework: 'javascript' },
    ]);
    expect(buildCompanyPlan(data, input({ framework: 'angular' })).formatPractice[0].why).toEqual({ kind: 'format', framework: 'angular' });
  });

  it('spends the budget on reports first, newest first, then links, tags and concept questions', () => {
    const data = fixture(
      [
        { id: 'reported-new', report: { publisher: 'Taro', date: '2026-05' }, rounds: ['coding'] },
        { id: 'reported-old', report: { publisher: 'Blind', date: '2020-01' }, rounds: ['coding'] },
        { id: 'linked', rounds: ['coding'] },
        { id: 'tagged-a' },
        { id: 'tagged-b' },
        { id: 'concept' },
      ],
      [round('coding', ['coding'])],
    );
    const plan = buildCompanyPlan(data, input({ when: 'this-week' }));
    expect(idsIn(plan, 'coding')).toEqual(['reported-new', 'reported-old', 'linked']);
    expect(plan.tasks[0].why).toEqual(jasmine.objectContaining({ kind: 'report', publisher: 'Taro', date: '2026-05' }));
    expect(plan.tasks[2].why).toEqual(jasmine.objectContaining({ kind: 'pick' }));
    expect(plan.formatPractice.map((entry) => entry.id)).toEqual(['format-a']);
    expect(plan.formatPractice[0].why).toEqual({ kind: 'format', framework: 'javascript' });

    const later = buildCompanyPlan(data, input({ when: 'later' }));
    expect(idsIn(later, 'coding')).toEqual(['reported-new', 'reported-old', 'linked', 'tagged-a', 'tagged-b', 'concept']);
  });

  it('opens a round on the practice link the guide shows there, ahead of its reports, unless that link is a guide', () => {
    const data = fixture(
      [
        { id: 'reported-new', report: { publisher: 'Taro', date: '2026-05' } },
        { id: 'reported-old', report: { publisher: 'Blind', date: '2020-01' } },
        { id: 'linked', rounds: ['coding'], lead: true },
        { id: '/guides/design', rounds: ['design'], lead: true },
        { id: 'design-b', rounds: ['design'] },
      ],
      [round('coding', ['coding']), round('design', ['design'])],
    );
    const plan = buildCompanyPlan(data, input({ when: 'later' }));
    expect(idsIn(plan, 'coding')).toEqual(['linked', 'reported-new', 'reported-old']);
    expect(plan.tasks[0].why).toEqual({ kind: 'pick' });
    expect(idsIn(plan, 'design')).toEqual(['design-b', '/guides/design']);
  });

  it('keeps at least one open task in every company, trading its last Premium task for its first open candidate', () => {
    const data = fixture(
      [
        { id: 'reported-old', report: { publisher: 'Blind', date: '2020-01' } },
        { id: 'format-a', report: { publisher: 'Taro', date: '2021-01' } },
        { id: 'format-b', report: { publisher: 'Taro', date: '2022-01' } },
        { id: 'tagged-a' },
      ],
      [round('coding', ['coding'])],
    );
    const tomorrow = buildCompanyPlan(data, input({ when: 'tomorrow' }));
    expect(tomorrow.tasks.map((entry) => entry.id)).toEqual(['reported-old', 'format-a', 'tagged-a']);
    expect(tomorrow.tasks.filter((entry) => entry.access === 'free').length).toBe(1);

    // With only Premium candidates nothing changes: format practice fills the budget, all of it Premium.
    const premiumOnly = fixture([{ id: 'reported-old', report: { publisher: 'Blind', date: '2020-01' } }], [round('coding', ['coding'])]);
    expect(buildCompanyPlan(premiumOnly, input({ when: 'tomorrow' })).tasks.map((entry) => entry.id)).toEqual(['reported-old', 'format-a', 'format-b']);
  });

  it('lets rounds take turns, so an early round cannot use the budget up', () => {
    const data = fixture(
      [{ id: 'tagged-a' }, { id: 'tagged-b' }, { id: 'linked' }, { id: 'reported-new' }],
      [round('first', ['coding']), round('second', ['coding'])],
    );
    const plan = buildCompanyPlan(data, input({ when: 'this-week' }));
    expect(idsIn(plan, 'first')).toEqual(['tagged-a', 'linked']);
    expect(idsIn(plan, 'second')).toEqual(['tagged-b']);
  });

  it('puts a task on the round whose words match it', () => {
    const data = {
      ...fixture(
        [{ id: 'tagged-a' }, { id: 'tagged-b' }],
        [round('algorithms', ['coding'], { focus: ['algo'] }), round('bug-squash', ['coding'], { focus: ['debug'] })],
      ),
    };
    const tasks = { ...data.tasks, 'tagged-a': task('tagged-a', { focus: ['debug', 'js'] }), 'tagged-b': task('tagged-b', { focus: ['algo', 'js'] }) };
    const plan = buildCompanyPlan({ ...data, tasks }, input());
    expect(idsIn(plan, 'bug-squash')).toEqual(['tagged-a']);
    expect(idsIn(plan, 'algorithms')).toEqual(['tagged-b']);

    const noMatch = { ...tasks, 'tagged-a': task('tagged-a', { focus: ['css'] }) };
    expect(buildCompanyPlan({ ...data, tasks: noMatch }, input()).tasks.map((entry) => entry.id)).toContain('tagged-a');
  });

  it('gives a passed round no tasks and moves its budget on', () => {
    const data = fixture(
      [{ id: 'linked', rounds: ['first'] }, { id: 'tagged-a', rounds: ['second'] }, { id: 'tagged-b' }],
      [round('first', ['coding']), round('second', ['coding'])],
    );
    const passed = companyPlanRoundKey('acme', 'main', 'first');
    const plan = buildCompanyPlan(data, input({ passedRounds: [passed] }));
    const first = plan.companies[0].rounds[0];
    expect(first.passed).toBeTrue();
    expect(first.tasks).toEqual([]);
    expect(plan.tasks.map((entry) => entry.id)).not.toContain('linked');
    expect(idsIn(plan, 'second')).toEqual(['tagged-a', 'tagged-b']);
  });

  it('holds system design to the cap for the level', () => {
    const data = fixture([{ id: 'design-a' }, { id: 'design-b' }], [round('design', ['design'])]);
    // One design task for a mid-level plan; the open-task rule makes it the free one, since the company would otherwise hold only Premium.
    expect(idsIn(buildCompanyPlan(data, input({ level: 'mid' })), 'design')).toEqual(['design-b']);
    expect(idsIn(buildCompanyPlan(data, input({ level: 'senior' })), 'design')).toEqual(['design-a', 'design-b']);
  });

  it('keeps solved tasks in the list, inside the budget, and asks for the next unsolved task', () => {
    const data = fixture([{ id: 'tagged-a' }, { id: 'tagged-b' }, { id: 'linked' }], [round('coding', ['coding'])]);
    const plan = buildCompanyPlan(data, input({ when: 'tomorrow', solvedTaskIds: ['tagged-a'] }));
    const ids = plan.tasks.map((entry) => entry.id);
    expect(ids).toContain('tagged-a');
    expect(plan.tasks.find((entry) => entry.id === 'tagged-a')?.solved).toBeTrue();
    expect(plan.tasks.length).toBe(3);
    expect(plan.next?.id).not.toBe('tagged-a');
    expect(plan.remainingMinutes).toBe(plan.totalMinutes - 30);
  });

  it('brings one Premium task into a Tomorrow plan of open tasks, from the company first', () => {
    const data = fixture([{ id: 'tagged-a' }, { id: 'tagged-b' }, { id: 'linked' }, { id: 'reported-old' }], [round('coding', ['coding'])]);
    const plan = buildCompanyPlan(data, input({ when: 'tomorrow' }));
    expect(plan.tasks.length).toBe(3);
    expect(plan.tasks.map((entry) => entry.id)).toContain('reported-old');
  });

  it('puts the next round\'s Premium task before format practice, and ahead of a later round\'s Premium in a Tomorrow plan', () => {
    const data = fixture(
      [{ id: 'tagged-a', rounds: ['coding'] }, { id: 'linked', rounds: ['coding'] }, { id: 'reported-old', rounds: ['coding'] }, { id: 'tagged-b', rounds: ['people'] }],
      [round('coding', ['coding']), round('people', ['people'])],
    );
    // This week the coding round is the day the person faces next: it takes its three tasks, its Premium report among
    // them, before the people round gets one, and the format slot goes to extra practice.
    const week = buildCompanyPlan(data, input({ when: 'this-week' }));
    expect(week.tasks.length).toBe(4);
    expect(idsIn(week, 'coding')).toEqual(['tagged-a', 'linked', 'reported-old']);
    expect(idsIn(week, 'people')).toEqual([]);
    expect(week.formatPractice.map((entry) => entry.id)).toEqual(['format-a']);

    // Tomorrow: 3 tasks, full after the rounds' first picks. The design round's Premium walkthrough makes way for
    // the coding round's Premium report, so the one Premium task sits on the round the person faces next.
    const later = fixture(
      [{ id: 'tagged-a', rounds: ['coding'] }, { id: 'linked', rounds: ['coding'] }, { id: 'reported-old', rounds: ['coding'] }, { id: 'design-a', rounds: ['design'] }],
      [round('coding', ['coding']), round('design', ['design'])],
    );
    const tomorrow = buildCompanyPlan(later, input({ when: 'tomorrow' }));
    expect(tomorrow.tasks.length).toBe(3);
    expect(tomorrow.companies[0].rounds[0].tasks.map((entry) => entry.id)).toContain('reported-old');
    expect(tomorrow.tasks.filter((entry) => entry.access === 'premium').map((entry) => entry.id)).toEqual(['reported-old']);
  });

  it('falls back to Premium format practice when the company has no Premium task', () => {
    const data = fixture([{ id: 'tagged-a' }, { id: 'tagged-b' }, { id: 'linked' }], [round('coding', ['coding'])]);
    const plan = buildCompanyPlan(data, input({ when: 'tomorrow' }));
    expect(plan.tasks.length).toBe(3);
    expect(plan.formatPractice.map((entry) => entry.id)).toEqual(['format-a']);
  });

  it('fills a thin plan with format practice, then lets rounds use what format practice left', () => {
    const thin = fixture([{ id: 'tagged-a' }], [round('coding', ['coding'])]);
    const plan = buildCompanyPlan(thin, input());
    expect(plan.tasks.map((entry) => entry.id)).toEqual(['tagged-a', 'format-a', 'format-b']);

    const covered = fixture([{ id: 'format-a' }, { id: 'format-b' }, { id: 'tagged-a' }, { id: 'tagged-b' }], [round('coding', ['coding'])]);
    const full = buildCompanyPlan(covered, input({ when: 'this-week' }));
    expect(full.tasks.map((entry) => entry.id)).toEqual(['format-a', 'format-b', 'tagged-a', 'tagged-b']);
    expect(full.formatPractice).toEqual([]);
  });

  it('gives a people or design round its guide after practice, and only when it has none', () => {
    const data = fixture([{ id: 'tagged-a' }], [round('coding', ['coding']), round('design', ['design']), round('values', ['people']), round('recruiter', ['recruiter']), round('offer', ['outcome'])]);
    const plan = buildCompanyPlan(data, input({ when: 'later' }));
    expect(idsIn(plan, 'design')).toEqual(['/guides/design']);
    expect(idsIn(plan, 'values')).toEqual(['/guides/people']);
    expect(idsIn(plan, 'recruiter')).toEqual([]);
    expect(idsIn(plan, 'offer')).toEqual([]);

    const owned = fixture([{ id: 'design-a', rounds: ['design'] }], [round('design', ['design'])]);
    expect(idsIn(buildCompanyPlan(owned, input({ when: 'later' })), 'design')).toEqual(['design-a']);
  });

  it('places a reported design task on a coding round when the company has no design round', () => {
    const data = fixture([{ id: 'design-a', report }], [round('coding', ['coding'])]);
    expect(idsIn(buildCompanyPlan(data, input()), 'coding')).toEqual(['design-a']);
  });

  it('offers runnable open tasks first in the preview, then concept questions, then starters, and locks nothing open', () => {
    const data = fixture(
      [{ id: 'reported-old', report }, { id: 'concept' }, { id: 'tagged-a' }],
      [round('coding', ['coding'])],
    );
    const plan = buildCompanyPlan(data, input({ when: 'tomorrow' }));
    expect(plan.preview.open.map((entry) => entry.id)).toEqual(['tagged-a', 'concept', 'starter-free']);
    expect(plan.preview.rest.map((entry) => entry.id)).toEqual(['reported-old']);
  });

  it('skips solved tasks in the preview unless nothing else is left', () => {
    const data = fixture([{ id: 'tagged-a' }, { id: 'tagged-b' }], [round('coding', ['coding'])]);
    const plan = buildCompanyPlan(data, input({ solvedTaskIds: ['tagged-a'] }));
    expect(plan.preview.open.map((entry) => entry.id)).toEqual(['tagged-b', 'starter-free', 'starter-free-2']);
    const everything = FIXTURE_TASKS.map((entry) => entry.id);
    const allSolved = buildCompanyPlan(data, input({ solvedTaskIds: everything }));
    expect(allSolved.preview.open.length).toBe(3);
  });

  it('opens the default list for every level, honours a switch, and ignores an unknown one', () => {
    const data = fixture([{ id: 'tagged-a' }], [round('coding', ['coding'])]);
    const list = data.companies['acme'].variants[0];
    const two: CompanyPlanData = {
      ...data,
      companies: {
        acme: {
          ...data.companies['acme'],
          variants: [
            { ...list, id: 'students', from: 'students', ask: 'Interviewing as a student?' },
            { ...list, id: 'experienced', from: 'experienced hires', ask: 'Interviewing as an experienced hire?', default: true },
          ],
        },
      },
    };
    for (const level of ['junior', 'staff'] as const) {
      const plan = buildCompanyPlan(two, input({ level }));
      expect(plan.companies[0].list.id).withContext(level).toBe('experienced');
      expect(plan.companies[0].list.chosen).withContext(level).toBeFalse();
      expect(plan.companies[0].switchLine).withContext(level).toEqual({
        text: 'These rounds come from experienced hires.',
        options: [{ listId: 'students', ask: 'Interviewing as a student?' }],
      });
    }

    const switched = buildCompanyPlan(two, input({ level: 'staff', lists: { acme: 'students' } }));
    expect(switched.companies[0].list.id).toBe('students');
    expect(switched.companies[0].list.chosen).toBeTrue();

    expect(buildCompanyPlan(two, input({ lists: { acme: 'gone' } })).companies[0].list.id).toBe('experienced');
  });

  it('warns about a level the accounts do not cover, unless the person chose that list', () => {
    const reported = { reported: { levels: ['senior', 'staff'], who: 'Senior and Staff candidates' } };
    const data = fixture([{ id: 'tagged-a' }], [round('coding', ['coding'])], reported);
    expect(buildCompanyPlan(data, input({ level: 'mid' })).warnings).toEqual([
      'No report from a mid-level candidate at Acme. These accounts come from Senior and Staff candidates. Confirm the loop with your recruiter.',
    ]);
    expect(buildCompanyPlan(data, input({ level: 'senior' })).warnings).toEqual([]);
    expect(buildCompanyPlan(data, input({ level: 'mid', lists: { acme: 'main' } })).warnings).toEqual([]);
  });

  it('warns about reports older than two years, to the month', () => {
    const at = (newestReport: string) => fixture([{ id: 'tagged-a' }], [round('coding', ['coding'])], { newestReport });
    expect(buildCompanyPlan(at('2024-10'), input()).warnings).toEqual([
      'The newest report behind these rounds is from October 2024. Formats may have changed, so confirm with your recruiter.',
    ]);
    expect(buildCompanyPlan(at('2024-11'), input()).warnings).toEqual([]);
    expect(buildCompanyPlan(fixture([{ id: 'tagged-a' }], [round('coding', ['coding'])]), input()).warnings).toEqual([]);
  });

  it('builds a general plan for no company or an unknown one, with nothing locked', () => {
    const data = fixture([{ id: 'tagged-a' }], [round('coding', ['coding'])]);
    for (const companies of [[], ['vercel']]) {
      const plan = buildCompanyPlan(data, input({ companies, when: 'this-week' }));
      expect(plan.general).toBeTrue();
      expect(plan.companies).toEqual([]);
      expect(plan.tasks.map((entry) => entry.id)).toEqual(['starter-free', 'starter-premium', 'starter-free-2', 'starter-free-3']);
      expect(plan.preview.open.map((entry) => entry.id)).toEqual(['starter-free', 'starter-free-2', 'starter-free-3']);
      expect(plan.preview.rest).toEqual([]);
      expect(plan.tasks[0].why).toEqual({ kind: 'general' });
    }
  });

  it('ignores an unknown company next to a known one and repeated slugs', () => {
    const data = fixture([{ id: 'tagged-a' }], [round('coding', ['coding'])]);
    const plan = buildCompanyPlan(data, input({ companies: ['vercel', 'acme', 'acme'] }));
    expect(plan.general).toBeFalse();
    expect(plan.companies.map((company) => company.slug)).toEqual(['acme']);
  });

  it('builds the tasks in the framework the person chose where the exercise exists in it, and keeps the rest as reported', () => {
    const data = fixture([{ id: 'widget-react', report }, { id: 'tagged-a' }], [round('coding', ['coding'])]);
    const angular = buildCompanyPlan(data, input({ when: 'this-week', framework: 'angular' }));
    expect(angular.framework).toBe('angular');
    expect(angular.companies[0].framework).toBe('angular');
    expect(idsIn(angular, 'coding')).toEqual(['widget-angular', 'tagged-a']);
    expect(angular.tasks[0].why).toEqual(jasmine.objectContaining({ kind: 'report', ...report }));
    // A thin company leaves budget to format practice, which comes from the chosen framework's pool.
    expect(angular.formatPractice.map((entry) => entry.id)).toEqual(['format-ng', 'format-b']);
    expect(angular.preview.rest.map((entry) => entry.id)).toContain('widget-angular');

    // Vue has no member of this family, so the reported React task stays; JavaScript keeps React for UI builds.
    expect(idsIn(buildCompanyPlan(data, input({ when: 'this-week', framework: 'vue' })), 'coding')).toEqual(['widget-react', 'tagged-a']);
    const javascript = buildCompanyPlan(data, input({ when: 'this-week', framework: 'javascript' }));
    expect(idsIn(javascript, 'coding')).toEqual(['widget-react', 'tagged-a']);
    expect(javascript.formatPractice.map((entry) => entry.id)).toEqual(['format-a', 'format-b']);

    const reported = buildCompanyPlan(data, input({ when: 'this-week' }));
    expect(reported.framework).toBeUndefined();
    expect(reported.companies[0].framework).toBe('javascript');
    expect(idsIn(reported, 'coding')).toEqual(['widget-react', 'tagged-a']);
  });

  it('marks a task the reports tie to no round as unbound, and binds the rest to their rounds', () => {
    const data = fixture([{ id: 'reported-new', report }, { id: 'linked', rounds: ['coding'] }], [round('coding', ['coding'])]);
    const plan = buildCompanyPlan(data, input({ when: 'this-week' }));
    expect(plan.tasks.find((task) => task.id === 'reported-new')?.why).toEqual({ kind: 'report', ...report, unbound: true });
    expect(plan.tasks.find((task) => task.id === 'linked')?.why).toEqual({ kind: 'pick' });
  });

  it('gives every open round its first task before any round gets a second, and a debug task before a second variant', () => {
    const data = fixture(
      [
        { id: 'widget-react', report, rounds: ['coding'] },
        { id: 'tagged-a', report, rounds: ['coding'] },
        { id: 'tagged-b', report, rounds: ['coding'] },
        { id: 'debug-a', report, rounds: ['coding'] },
        { id: 'design-a', report, rounds: ['design'] },
      ],
      [round('coding', ['coding']), round('design', ['design']), round('people', ['people'])],
    );
    const withDebug = { ...data, tasks: { ...data.tasks, 'debug-a': task('debug-a', { kind: 'debug', route: '/javascript/debug/debug-a', access: 'premium' }) } };
    const plan = buildCompanyPlan(withDebug, input({ when: 'next-week', level: 'senior' }));
    // The first three round slots go to the coding round's first task, the design round's walkthrough and the
    // behavioural guide the people round has as its only candidate; the coding round then gets its Premium debug task
    // before a second variant.
    const rounds = plan.companies[0].rounds.map((entry) => entry.tasks.map((item) => item.id));
    expect(rounds[0].slice(0, 2)).toEqual(['widget-react', 'debug-a']);
    expect(rounds[1]).toEqual(['design-a']);
    expect(rounds[2]).toEqual(['/guides/people']);
    const later = buildCompanyPlan(withDebug, input({ when: 'later', level: 'senior' }));
    expect(idsIn(later, 'coding').slice(0, 2)).toEqual(['widget-react', 'debug-a']);
  });

  it('on the real data, a chosen framework gives every family task and the format practice in that framework', () => {
    for (const framework of ['react', 'angular', 'vue'] as const) {
      for (const slug of Object.keys(REAL_DATA.companies)) {
        const plan = buildCompanyPlan(REAL_DATA, { companies: [slug], when: 'later', level: 'senior', framework, today: TODAY });
        expect(plan.companies[0].framework).withContext(`${slug}/${framework}`).toBe(framework);
        for (const entry of plan.tasks) {
          const members = entry.family ? REAL_DATA.general.familyMembers?.[entry.family] : undefined;
          if (members?.[framework]) expect(entry.tech).withContext(`${slug}/${framework}: ${entry.id}`).toBe(framework);
        }
        for (const entry of plan.formatPractice) expect(entry.tech).withContext(`${slug}/${framework}: format ${entry.id}`).toBe(framework);
      }
    }
  });

  it('fills the day the person faces next before a later round on a near date, and leaves tasks tied to no round for later', () => {
    // The screen is tomorrow: its three tied tasks are the plan, though the final loop has a practice link and an
    // untied report would rank first further out.
    const data = fixture(
      [
        { id: 'reported-new', report: { publisher: 'Taro', date: '2026-05' } },
        { id: 'linked', rounds: ['screen'], lead: true },
        { id: 'tagged-a', rounds: ['screen'] },
        { id: 'reported-old', rounds: ['screen'] },
        { id: 'tagged-b', rounds: ['final-coding'], lead: true },
      ],
      [round('screen', ['coding']), round('final-coding', ['coding'], { name: 'Final loop: coding' })],
    );
    const tomorrow = buildCompanyPlan(data, input({ when: 'tomorrow' }));
    expect(idsIn(tomorrow, 'screen')).toEqual(['linked', 'tagged-a', 'reported-old']);
    expect(idsIn(tomorrow, 'final-coding')).toEqual([]);
    expect(tomorrow.tasks.map((entry) => entry.id)).not.toContain('reported-new');

    // Further out every round gets its first task, and the untied report takes its place again.
    const later = buildCompanyPlan(data, input({ when: 'later' }));
    expect(idsIn(later, 'final-coding')).toContain('tagged-b');
    expect(later.tasks.map((entry) => entry.id)).toContain('reported-new');
  });

  it('treats rounds that share a name before a colon as one day, so a Power Day tomorrow covers its rounds in turn', () => {
    const data = fixture(
      [
        { id: 'design-a', rounds: ['day-design'], lead: true },
        { id: 'linked', rounds: ['day-coding'], lead: true },
        { id: 'tagged-a', rounds: ['day-coding'] },
        { id: 'tagged-b', rounds: ['later'], lead: true },
      ],
      [
        round('day-design', ['design'], { name: 'Power Day: design' }),
        round('day-coding', ['coding'], { name: 'Power Day: coding' }),
        round('later', ['coding'], { name: 'Team match' }),
      ],
    );
    const tomorrow = buildCompanyPlan(data, input({ when: 'tomorrow', level: 'senior' }));
    expect(idsIn(tomorrow, 'day-design')).toEqual(['design-a']);
    expect(idsIn(tomorrow, 'day-coding')).toEqual(['linked', 'tagged-a']);
    expect(idsIn(tomorrow, 'later')).toEqual([]);
  });

  it('gives a senior or staff person whose next round is design general design cases there instead of format practice', () => {
    const rows: CompanyPlanDataRow[] = [{ id: 'design-a', rounds: ['design'], lead: true }, { id: 'linked', rounds: ['coding'] }];
    const rounds = [round('coding', ['coding']), round('design', ['design']), round('values', ['people'])];
    const base = fixture(rows, rounds);
    const data = { ...base, general: { ...base.general, designPractice: ['design-b'] } } as CompanyPlanData;
    const passed = [companyPlanRoundKey('acme', 'main', 'coding')];

    const staff = buildCompanyPlan(data, input({ when: 'few-weeks', level: 'staff', passedRounds: passed }));
    expect(idsIn(staff, 'design')).toEqual(['design-a', 'design-b']);
    expect(staff.tasks.find((entry) => entry.id === 'design-b')?.why).toEqual({ kind: 'pick' });
    expect(staff.formatPractice).toEqual([]);

    // A mid-level plan keeps one design task and its format practice; a design round that is not next takes no cases.
    const mid = buildCompanyPlan(data, input({ when: 'few-weeks', level: 'mid', passedRounds: passed }));
    expect(idsIn(mid, 'design')).toEqual(['design-a']);
    expect(mid.formatPractice.length).toBeGreaterThan(0);
    const notNext = buildCompanyPlan(data, input({ when: 'few-weeks', level: 'staff' }));
    expect(notNext.tasks.map((entry) => entry.id)).not.toContain('design-b');
  });

  it('drops a task tied to no round when every round that fits its words is behind the person', () => {
    const data = fixture(
      [{ id: 'tagged-a' }, { id: 'linked', rounds: ['algorithms'] }],
      [round('ui', ['coding'], { focus: ['ui'] }), round('algorithms', ['coding'], { focus: ['algo'] })],
    );
    const tasks = { ...data.tasks, 'tagged-a': task('tagged-a', { focus: ['ui'] }) };
    const passedUi = [companyPlanRoundKey('acme', 'main', 'ui')];
    expect(buildCompanyPlan({ ...data, tasks }, input({ passedRounds: passedUi })).tasks.map((entry) => entry.id)).not.toContain('tagged-a');
    expect(idsIn(buildCompanyPlan({ ...data, tasks }, input()), 'ui')).toEqual(['tagged-a']);
  });
});
