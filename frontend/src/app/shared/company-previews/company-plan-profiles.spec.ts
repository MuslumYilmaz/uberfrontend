import reportFile from '../../../../../cdn/questions/company-reports.json';
import { COMPANY_BRANDS } from '../company-branding';
import { FRAMEWORK_FAMILIES, FRAMEWORK_FAMILY_BY_ID } from '../framework-families';
import { companyMatchesSearch, companyPlanSearchKey } from '../../features/company/company-plan/company-plan-search';
import { COMPANY_INTERVIEW_PROCESSES, CompanyInterviewProcess } from './company-interview-processes';
import {
  COMPANY_PLAN_EXTRA_FAMILIES,
  COMPANY_PLAN_PROFILES,
  CompanyPlanFramework,
  companyPlanFamilyMember,
} from './company-plan-profiles';
import { COMPANY_SIGNATURES } from './company-signatures';

type ReportRow = { readonly id: string; readonly tech?: string };

const REPORTS = reportFile.companies as unknown as Readonly<Record<string, readonly ReportRow[] | undefined>>;
const FRAMEWORK_WORDS: Readonly<Record<string, RegExp>> = { react: /\bReact\b/, angular: /\bAngular\b/, vue: /\bVue\b/ };
const FRAMEWORK_PATH = /^\/(react|angular|vue)\/[a-z]+\/([^/]+)$/;
const ALL_FRAMEWORKS: readonly CompanyPlanFramework[] = ['react', 'angular', 'vue', 'javascript'];

function processText(process: CompanyInterviewProcess): string {
  const stages = process.variants.flatMap((variant) => [variant.title, variant.note ?? '', ...variant.stages.flatMap((stage) => [stage.stage, stage.format])]);
  return [process.summary, process.caveat, ...stages].join(' ');
}

function frameworkTasks(slug: string, process: CompanyInterviewProcess): { id: string; tech: string }[] {
  const reported = (REPORTS[slug] ?? []).flatMap((row) => (row.tech && FRAMEWORK_WORDS[row.tech] ? [{ id: row.id, tech: row.tech }] : []));
  const linked = process.variants.flatMap((variant) => variant.stages.flatMap((stage) => {
    const match = stage.practice?.path.match(FRAMEWORK_PATH);
    return match ? [{ id: match[2], tech: match[1] }] : [];
  }));
  return [...reported, ...linked];
}

describe('company plan profiles', () => {
  it('covers exactly the companies of the process table', () => {
    expect(Object.keys(COMPANY_PLAN_PROFILES).sort()).toEqual(Object.keys(COMPANY_INTERVIEW_PROCESSES).sort());
    expect(Object.keys(COMPANY_SIGNATURES).sort()).toEqual(Object.keys(COMPANY_INTERVIEW_PROCESSES).sort());
  });

  for (const [slug, process] of Object.entries(COMPANY_INTERVIEW_PROCESSES)) {
    const profile = COMPANY_PLAN_PROFILES[slug];

    it(`${slug}: the signature uses words from the company's own table`, () => {
      const text = processText(process).toLowerCase();
      for (const word of COMPANY_SIGNATURES[slug].toLowerCase().split(/\s+/)) {
        expect(text.includes(word)).withContext(word).toBeTrue();
      }
    });

    it(`${slug}: a named framework is in the company's own table or reports, with the reason written down`, () => {
      expect(profile.evidence.trim().length).toBeGreaterThan(0);
      const word = FRAMEWORK_WORDS[profile.framework];
      if (!word) return;
      const reported = (REPORTS[slug] ?? []).some((row) => row.tech === profile.framework);
      expect(reported || word.test(processText(process))).toBeTrue();
    });

    it(`${slug}: no reported or linked task stays in another framework`, () => {
      const expected = profile.framework === 'javascript' ? 'react' : profile.framework;
      for (const task of frameworkTasks(slug, process)) {
        const landed = companyPlanFamilyMember(task.id, profile.framework)?.tech ?? task.tech;
        expect(landed).withContext(task.id).toBe(expected);
      }
    });
  }

  it('turns every family into one task for any framework, so it cannot enter a plan twice', () => {
    for (const family of [...FRAMEWORK_FAMILIES, ...COMPANY_PLAN_EXTRA_FAMILIES]) {
      expect(family.members.map((member) => member.tech).sort()).withContext(family.key).toEqual(['angular', 'react', 'vue']);
      for (const framework of ALL_FRAMEWORKS) {
        const landed = new Set(family.members.map((member) => companyPlanFamilyMember(member.id, framework)?.id));
        expect(landed.size).withContext(`${family.key} / ${framework}`).toBe(1);
        expect([...landed][0]).withContext(`${family.key} / ${framework}`).toBeDefined();
      }
    }
  });

  it('translates a reported task and leaves a task with no counterparts alone', () => {
    expect(companyPlanFamilyMember('react-autocomplete-search-starter', 'angular')?.id).toBe('angular-autocomplete-search-starter');
    expect(companyPlanFamilyMember('vue-autocomplete-search', 'react')?.id).toBe('react-autocomplete-search-starter');
    expect(companyPlanFamilyMember('angular-star-rating', 'javascript')?.id).toBe('react-star-rating');
    expect(companyPlanFamilyMember('angular-chessboard-click-highlight', 'vue')?.id).toBe('vue-chessboard-click-highlight');
    expect(companyPlanFamilyMember('react-file-explorer', 'angular')).toBeNull();
  });

  it('keeps extra families out of the shared map, so a later addition there removes them here', () => {
    for (const family of COMPANY_PLAN_EXTRA_FAMILIES) {
      for (const member of family.members) expect(FRAMEWORK_FAMILY_BY_ID.has(member.id)).withContext(member.id).toBeFalse();
    }
  });

  it('finds the five other names and never sends a name to the wrong company', () => {
    const owners = new Map<string, string>();
    for (const slug of Object.keys(COMPANY_PLAN_PROFILES)) owners.set(companyPlanSearchKey(COMPANY_BRANDS[slug].label), slug);
    for (const [slug, profile] of Object.entries(COMPANY_PLAN_PROFILES)) {
      for (const alias of profile.aliases ?? []) {
        const key = companyPlanSearchKey(alias);
        expect([undefined, slug]).withContext(alias).toContain(owners.get(key));
        owners.set(key, slug);
      }
    }
    expect(owners.get(companyPlanSearchKey('Facebook'))).toBe('meta');
    expect(owners.get(companyPlanSearchKey('Instagram'))).toBe('meta');
    expect(owners.get(companyPlanSearchKey('JP Morgan'))).toBe('jpmorgan');
    expect(owners.get(companyPlanSearchKey('TikTok'))).toBe('bytedance');
    expect(owners.get(companyPlanSearchKey('AWS'))).toBe('amazon');
    expect(owners.get(companyPlanSearchKey('x.ai'))).toBe('xai');
    expect(companyPlanSearchKey('Résumé, Eleven-Labs')).toBe('resumeelevenlabs');
  });

  it('matches a typed query against the name and the other names', () => {
    expect(companyMatchesSearch('eleven labs', 'ElevenLabs')).toBeTrue();
    expect(companyMatchesSearch('x.ai', 'xAI')).toBeTrue();
    expect(companyMatchesSearch('insta', 'Meta', ['Facebook', 'Instagram'])).toBeTrue();
    expect(companyMatchesSearch('jp morgan', 'JPMorgan Chase')).toBeTrue();
    expect(companyMatchesSearch('vercel', 'Meta', ['Facebook', 'Instagram'])).toBeFalse();
    expect(companyMatchesSearch('   ', 'Meta')).toBeTrue();
  });
});
