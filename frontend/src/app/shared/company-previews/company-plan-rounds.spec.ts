import reportFile from '../../../../../cdn/questions/company-reports.json';
import { COMPANY_INTERVIEW_PROCESSES } from './company-interview-processes';
import { COMPANY_PLAN_LEVELS, COMPANY_PLAN_NOTE_MAX_LENGTH, COMPANY_PLAN_ROUNDS, companyPlanRoundNote } from './company-plan-rounds';

type ReportRow = { readonly id: string; readonly sources: readonly { readonly url: string }[] };

const REPORTS = reportFile.companies as unknown as Readonly<Record<string, readonly ReportRow[] | undefined>>;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ID_MAX_LENGTH = 64;
const numbersIn = (text: string) => text.match(/\d+/g) ?? [];

describe('company plan rounds', () => {
  it('covers exactly the companies of the process table', () => {
    expect(Object.keys(COMPANY_PLAN_ROUNDS).sort()).toEqual(Object.keys(COMPANY_INTERVIEW_PROCESSES).sort());
  });

  for (const [slug, process] of Object.entries(COMPANY_INTERVIEW_PROCESSES)) {
    const plan = COMPANY_PLAN_ROUNDS[slug];
    const several = process.variants.length > 1;

    it(`${slug}: every list and stage of the process table has plan data, and nothing else does`, () => {
      expect(plan?.variants.map((variant) => variant.title)).toEqual(process.variants.map((variant) => variant.title));
      process.variants.forEach((variant, index) => {
        expect(plan?.variants[index]?.rounds.map((round) => round.stage))
          .withContext(variant.title)
          .toEqual(variant.stages.map((stage) => stage.stage));
      });
    });

    it(`${slug}: ids can be saved on an account and every round says what it tests`, () => {
      const variantIds = plan.variants.map((variant) => variant.id);
      expect(new Set(variantIds).size).toBe(variantIds.length);
      for (const variant of plan.variants) {
        expect(variant.id).toMatch(ID);
        const roundIds = variant.rounds.map((round) => round.id);
        expect(new Set(roundIds).size).withContext(variant.id).toBe(roundIds.length);
        for (const round of variant.rounds) {
          expect(round.id).toMatch(ID);
          expect(round.id.length).withContext(round.id).toBeLessThanOrEqual(ID_MAX_LENGTH);
          expect(round.kinds.length).withContext(round.id).toBeGreaterThan(0);
          expect(new Set(round.kinds).size).withContext(round.id).toBe(round.kinds.length);
          for (const pick of round.picks ?? []) expect(pick).withContext(round.id).toMatch(/^\/[a-z0-9/-]+$/);
        }
      }
    });

    it(`${slug}: a plan note fits the row and adds no number the table lacks`, () => {
      process.variants.forEach((variant, variantIndex) => {
        variant.stages.forEach((stage, stageIndex) => {
          const round = plan.variants[variantIndex].rounds[stageIndex];
          const where = `${plan.variants[variantIndex].id} / ${round.id}`;
          const note = companyPlanRoundNote(round, stage.format);
          expect(note.length).withContext(where).toBeLessThanOrEqual(COMPANY_PLAN_NOTE_MAX_LENGTH);
          expect(note).withContext(where).toMatch(/[.!?]["”]?$/);
          if (!round.note) return;
          const tableNumbers = new Set(numbersIn(stage.format));
          for (const value of numbersIn(round.note)) {
            expect(tableNumbers.has(value)).withContext(`${where}: ${value}`).toBeTrue();
          }
        });
      });
    });

    it(`${slug}: ${several ? 'every level opens on the same list and every list can be reached' : 'a single list needs no switching copy'}`, () => {
      if (!several) {
        for (const variant of plan.variants) {
          expect(variant.id).toBe('main');
          expect(variant.from).toBeUndefined();
          expect(variant.ask).toBeUndefined();
          expect(variant.default).toBeUndefined();
        }
        return;
      }
      for (const variant of plan.variants) {
        expect(variant.from?.trim().length).withContext(variant.id).toBeGreaterThan(0);
        expect(variant.ask).withContext(variant.id).toMatch(/^Interviewing .+\?$/);
      }
      expect(plan.variants.filter((variant) => variant.default).length).toBe(1);
    });

    it(`${slug}: every reported question belongs to a list, by a cited source or by hand`, () => {
      const assigned = plan.reportVariants ?? {};
      const known = new Set(plan.variants.map((variant) => variant.id));
      const rows = REPORTS[slug] ?? [];
      if (!several) {
        expect(Object.keys(assigned)).toEqual([]);
        return;
      }
      for (const row of rows) {
        const urls = new Set(row.sources.map((source) => source.url));
        const cited = process.variants.some((variant) => variant.stages.some((stage) => stage.sources.some((source) => urls.has(source.url))));
        const manual = assigned[row.id];
        expect(cited !== Boolean(manual)).withContext(`${row.id}: needs a list by hand only when no list cites it`).toBeTrue();
      }
      const reportedIds = new Set(rows.map((row) => row.id));
      for (const [id, variants] of Object.entries(assigned)) {
        expect(reportedIds.has(id)).withContext(`${id} is not reported for ${slug}`).toBeTrue();
        expect(variants.length).withContext(id).toBeGreaterThan(0);
        for (const variant of variants) expect(known.has(variant)).withContext(`${id}: ${variant}`).toBeTrue();
      }
    });
  }

  it('warns only with a named group, and only for levels the plan knows', () => {
    for (const [slug, company] of Object.entries(COMPANY_PLAN_ROUNDS)) {
      for (const variant of company.variants) {
        if (!variant.reported) continue;
        expect(variant.reported.who.trim().length).withContext(`${slug} / ${variant.id}`).toBeGreaterThan(0);
        expect(variant.reported.levels.length).withContext(`${slug} / ${variant.id}`).toBeGreaterThan(0);
        for (const level of variant.reported.levels) expect(COMPANY_PLAN_LEVELS).toContain(level);
      }
    }
  });

  it('takes the first sentence of the format when a round has no note', () => {
    const round = { id: 'x', stage: 'X', kinds: ['coding'] } as const;
    expect(companyPlanRoundNote(round, 'Build a form with Object.assign and Vue.js. It took an hour.')).toBe('Build a form with Object.assign and Vue.js.');
    expect(companyPlanRoundNote(round, '"Write a small app." Posting only.')).toBe('"Write a small app."');
    expect(companyPlanRoundNote(round, 'One sentence only.')).toBe('One sentence only.');
    expect(companyPlanRoundNote({ ...round, note: 'A shorter line.' }, 'A much longer line. And more.')).toBe('A shorter line.');
  });
});
