import { PLATFORM_ID, computed, signal } from '@angular/core';
import { HttpHeaders, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { CompanyPlanAnswers, SavedCompanyPlan } from '../../../core/models/company-plan.model';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { PracticeAssetResolverService } from '../../../core/services/practice-asset-resolver.service';
import { UserProgressService } from '../../../core/services/user-progress.service';
import { apiUrl } from '../../../core/utils/api-base';
import { CompanyPlanData } from './company-plan.engine';
import { CompanyPlanService, cleanCompanyQuery } from './company-plan.service';

const DRAFT_KEY = 'fa:company-plan:draft:v1';
const PLAN_URL = apiUrl('/users/me/company-plan');
const DATA_URL = '/assets/questions/company-plan-data.json';

const ELEVENLABS: CompanyPlanAnswers = { companies: [{ slug: 'elevenlabs' }], level: 'senior', when: 'next-week' };
const AGODA: CompanyPlanAnswers = { companies: [{ slug: 'agoda', list: 'gurgaon' }], level: 'mid', when: 'later' };

const saved = (answers: CompanyPlanAnswers, overrides: Partial<SavedCompanyPlan> = {}): SavedCompanyPlan => ({
  ...answers,
  createdAt: '2026-11-02T10:00:00.000Z',
  passedRounds: [],
  markedDone: [],
  ...overrides,
});

const user = (id: string, companyPlan: SavedCompanyPlan | null = null) => ({ _id: id, companyPlan }) as never;

const DATA = {
  schemaVersion: 1,
  general: { starters: [], formatPractice: { react: [], angular: [], vue: [], javascript: [] }, guides: { people: '', design: '' } },
  tasks: {
    done: { id: 'done', title: 'Done', route: '/javascript/coding/done', kind: 'coding', tech: 'javascript', access: 'free', minutes: 30 },
    marked: { id: 'marked', title: 'Marked', route: '/guides/marked', kind: 'guide', access: 'free', minutes: 15 },
    todo: { id: 'todo', title: 'Todo', route: '/javascript/coding/todo', kind: 'coding', tech: 'javascript', access: 'free', minutes: 30 },
  },
  companies: {
    elevenlabs: {
      name: 'ElevenLabs',
      signature: 'Round',
      framework: 'react',
      checkedAt: '2026-10-22',
      variants: [
        {
          id: 'main',
          title: 'Engineers',
          sourceCount: 1,
          rounds: [{ id: 'coding', name: 'Coding', kinds: ['coding'], note: 'Note.', sources: [] }, { id: 'second', name: 'Second', kinds: ['coding'], note: 'Note.', sources: [] }],
          tasks: [{ id: 'done' }, { id: 'marked', rounds: ['coding'] }, { id: 'todo' }],
        },
      ],
    },
  },
} as unknown as CompanyPlanData;

describe('CompanyPlanService', () => {
  let authUser: ReturnType<typeof signal<any>>;
  let solvedIds: ReturnType<typeof signal<string[]>>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let http: HttpTestingController;

  function setup(options: { platform?: string } = {}) {
    authUser = signal<any>(null);
    solvedIds = signal<string[]>([]);
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: options.platform ?? 'browser' },
        { provide: AuthService, useValue: { user: authUser, isLoggedIn: computed(() => !!authUser()), headers: () => new HttpHeaders() } },
        { provide: UserProgressService, useValue: { solvedIds } },
        { provide: AnalyticsService, useValue: analytics },
        {
          provide: PracticeAssetResolverService,
          useValue: { getVersion: () => of('v1'), getAssetUrls: () => ({ primary: DATA_URL, fallback: DATA_URL }) },
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(CompanyPlanService);
    TestBed.flushEffects();
    return service;
  }

  const logIn = (value: unknown) => {
    authUser.set(value);
    TestBed.flushEffects();
  };

  beforeEach(() => localStorage.removeItem(DRAFT_KEY));

  afterEach(() => {
    http.verify();
    localStorage.removeItem(DRAFT_KEY);
    TestBed.resetTestingModule();
  });

  describe('a guest', () => {
    it('keeps the answers in this browser and sends nothing', async () => {
      const service = setup();
      expect(await firstValueFrom(service.save(ELEVENLABS))).toBe('draft');
      expect(service.answers()).toEqual(ELEVENLABS);
      expect(JSON.parse(localStorage.getItem(DRAFT_KEY) as string)).toEqual(ELEVENLABS);
    });

    it('finds the draft after a reload', () => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(AGODA));
      expect(setup().answers()).toEqual(AGODA);
    });

    it('drops a damaged draft instead of trusting it', () => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ companies: [{ slug: 'Not A Slug' }], level: 'senior', when: 'later' }));
      expect(setup().draft()).toBeNull();
      expect(localStorage.getItem(DRAFT_KEY)).toBeNull();

      localStorage.setItem(DRAFT_KEY, '{not json');
      expect(setup().draft()).toBeNull();
    });

    it('still works when the browser refuses storage', async () => {
      const spies = (['getItem', 'setItem', 'removeItem'] as const).map((method) => spyOn(Storage.prototype, method).and.throwError('denied'));
      const service = setup();
      expect(service.draft()).toBeNull();
      expect(await firstValueFrom(service.save(ELEVENLABS))).toBe('draft');
      expect(service.answers()).toEqual(ELEVENLABS);
      for (const spy of spies) spy.and.callThrough();
    });

    it('rejects answers that cannot be a plan', async () => {
      const service = setup();
      const tooMany = { ...ELEVENLABS, companies: [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }, { slug: 'd' }] };
      expect(await firstValueFrom(service.save(tooMany))).toBe('invalid');
      expect(await firstValueFrom(service.save({ ...ELEVENLABS, level: 'principal' as never }))).toBe('invalid');
      expect(service.draft()).toBeNull();
    });
  });

  describe('on the server', () => {
    it('reads no storage and fetches no data', async () => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(AGODA));
      const service = setup({ platform: 'server' });
      expect(service.draft()).toBeNull();
      expect(await firstValueFrom(service.loadData())).toBeNull();
      expect(await firstValueFrom(service.save(ELEVENLABS))).toBe('draft');
      expect(JSON.parse(localStorage.getItem(DRAFT_KEY) as string)).toEqual(AGODA);
    });
  });

  describe('moving a draft to the account', () => {
    it('writes it after login and clears it once the server has it', () => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(ELEVENLABS));
      const service = setup();
      logIn(user('a'));

      const request = http.expectOne(PLAN_URL);
      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual(ELEVENLABS);
      expect(localStorage.getItem(DRAFT_KEY)).not.toBeNull();

      request.flush({ companyPlan: saved(ELEVENLABS) });
      expect(service.saved()).toEqual(saved(ELEVENLABS));
      expect(service.draft()).toBeNull();
      expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
      expect(authUser().companyPlan).toEqual(saved(ELEVENLABS));
    });

    it('keeps the draft when the write fails, and a retry moves it', () => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(ELEVENLABS));
      const service = setup();
      logIn(user('a'));

      http.expectOne(PLAN_URL).flush({}, { status: 500, statusText: 'Server Error' });
      expect(service.syncFailed()).toBeTrue();
      expect(service.draft()).toEqual(ELEVENLABS);
      expect(service.saved()).toBeNull();
      expect(localStorage.getItem(DRAFT_KEY)).not.toBeNull();

      service.syncDraft();
      http.expectOne(PLAN_URL).flush({ companyPlan: saved(ELEVENLABS) });
      expect(service.syncFailed()).toBeFalse();
      expect(service.draft()).toBeNull();
    });

    it('sends one write when /me refreshes during the login', () => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(ELEVENLABS));
      setup();
      logIn(user('a'));
      logIn(user('a'));
      logIn(user('a'));
      const requests = http.match(PLAN_URL);
      expect(requests.length).toBe(1);
      requests[0].flush({ companyPlan: saved(ELEVENLABS) });
    });

    it('never overwrites a plan already on the account', () => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(AGODA));
      const service = setup();
      logIn(user('a', saved(ELEVENLABS)));

      http.expectNone(PLAN_URL);
      expect(service.answers()).toEqual(saved(ELEVENLABS));
      expect(service.draft()).toEqual(AGODA);
      expect(service.draftConflict()).toBeTrue();
    });

    it('lets the person replace the plan after being asked', async () => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(AGODA));
      const service = setup();
      logIn(user('a', saved(ELEVENLABS)));

      const outcome = firstValueFrom(service.save(AGODA));
      const request = http.expectOne(PLAN_URL);
      expect(request.request.body).toEqual(AGODA);
      request.flush({ companyPlan: saved(AGODA) });

      expect(await outcome).toBe('saved');
      expect(service.saved()).toEqual(saved(AGODA));
      expect(service.draft()).toBeNull();
      expect(service.draftConflict()).toBeFalse();
    });

    it('clears a draft that matches the plan on the account', () => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(ELEVENLABS));
      const service = setup();
      logIn(user('a', saved(ELEVENLABS)));
      http.expectNone(PLAN_URL);
      expect(service.draft()).toBeNull();
      expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
    });

    it('drops a response that arrives after logout', () => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(ELEVENLABS));
      const service = setup();
      logIn(user('a'));
      const request = http.expectOne(PLAN_URL);

      logIn(null);
      request.flush({ companyPlan: saved(ELEVENLABS) });

      expect(service.saved()).toBeNull();
      expect(authUser()).toBeNull();
    });

    it('does not let an older write overwrite a newer save', async () => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(ELEVENLABS));
      const service = setup();
      logIn(user('a'));
      const first = http.expectOne(PLAN_URL);

      const outcome = firstValueFrom(service.save(AGODA));
      const second = http.match(PLAN_URL)[0];
      second.flush({ companyPlan: saved(AGODA) });
      first.flush({ companyPlan: saved(ELEVENLABS) });

      expect(await outcome).toBe('saved');
      expect(service.saved()).toEqual(saved(AGODA));
      expect(service.draft()).toBeNull();
    });

    it('keeps a newer draft when an older write comes back', () => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(ELEVENLABS));
      const service = setup();
      logIn(user('a'));
      const request = http.expectOne(PLAN_URL);

      localStorage.setItem(DRAFT_KEY, JSON.stringify(AGODA));
      (service as any).draftState.set(AGODA);
      request.flush({ companyPlan: saved(ELEVENLABS) });

      expect(service.draft()).toEqual(AGODA);
      expect(localStorage.getItem(DRAFT_KEY)).not.toBeNull();
    });
  });

  describe('changing accounts', () => {
    it('forgets the plan on logout and does not carry a draft to the next account', () => {
      const service = setup();
      logIn(user('a', saved(ELEVENLABS)));
      (service as any).draftState.set(AGODA);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(AGODA));

      logIn(null);
      expect(service.saved()).toBeNull();
      expect(service.draft()).toBeNull();
      expect(localStorage.getItem(DRAFT_KEY)).toBeNull();

      logIn(user('b'));
      http.expectNone(PLAN_URL);
      expect(service.saved()).toBeNull();
    });

    it('shows the plan of the new account after a switch', () => {
      const service = setup();
      logIn(user('a', saved(ELEVENLABS)));
      logIn(user('b', saved(AGODA)));
      expect(service.saved()).toEqual(saved(AGODA));
    });
  });

  describe('marks', () => {
    const key = 'elevenlabs/main/coding';

    it('update the screen before the server answers', async () => {
      const service = setup();
      logIn(user('a', saved(ELEVENLABS)));

      const done = service.setRoundPassed(key, true);
      expect(service.saved()?.passedRounds).toEqual([key]);

      const request = http.expectOne(PLAN_URL);
      expect(request.request.method).toBe('PATCH');
      expect(request.request.body).toEqual({ kind: 'round', id: key, on: true });
      request.flush({ companyPlan: saved(ELEVENLABS, { passedRounds: [key] }) });

      expect(await done).toBeTrue();
      expect(authUser().companyPlan.passedRounds).toEqual([key]);
    });

    it('roll back when the server refuses, and only the failed one', async () => {
      const service = setup();
      logIn(user('a', saved(ELEVENLABS, { markedDone: ['kept'] })));

      const failed = service.setTaskDone('js-a', true);
      const ok = service.setTaskDone('js-b', true);
      expect(service.saved()?.markedDone).toEqual(['kept', 'js-a', 'js-b']);

      const [first, second] = http.match(PLAN_URL);
      first.flush({}, { status: 500, statusText: 'Server Error' });
      expect(await failed).toBeFalse();
      expect(service.saved()?.markedDone).toEqual(['kept', 'js-b']);

      second.flush({ companyPlan: saved(ELEVENLABS, { markedDone: ['kept', 'js-b'] }) });
      expect(await ok).toBeTrue();
      expect(service.saved()?.markedDone).toEqual(['kept', 'js-b']);
    });

    it('survive an older answer while another click is on its way', async () => {
      const service = setup();
      logIn(user('a', saved(ELEVENLABS)));

      const first = service.setTaskDone('js-a', true);
      const second = service.setTaskDone('js-b', true);
      const [firstRequest, secondRequest] = http.match(PLAN_URL);

      firstRequest.flush({ companyPlan: saved(ELEVENLABS, { markedDone: ['js-a'] }) });
      await first;
      expect(service.saved()?.markedDone).toEqual(['js-a', 'js-b']);

      secondRequest.flush({ companyPlan: saved(ELEVENLABS, { markedDone: ['js-a', 'js-b'] }) });
      await second;
      expect(service.saved()?.markedDone).toEqual(['js-a', 'js-b']);
    });

    it('survive a /me refresh that arrives mid-click', async () => {
      const service = setup();
      logIn(user('a', saved(ELEVENLABS)));

      const done = service.setRoundPassed(key, true);
      logIn(user('a', saved(ELEVENLABS)));
      expect(service.saved()?.passedRounds).toEqual([key]);

      http.expectOne(PLAN_URL).flush({ companyPlan: saved(ELEVENLABS, { passedRounds: [key] }) });
      await done;
      expect(service.saved()?.passedRounds).toEqual([key]);
    });

    it('do nothing without a plan on an account', async () => {
      const service = setup();
      expect(await service.setRoundPassed(key, true)).toBeFalse();
      expect(await service.setTaskDone('js-a', true)).toBeFalse();
    });

    it('drop an answer that arrives after logout', async () => {
      const service = setup();
      logIn(user('a', saved(ELEVENLABS)));
      const done = service.setTaskDone('js-a', true);
      const request = http.expectOne(PLAN_URL);
      logIn(null);
      request.flush({ companyPlan: saved(ELEVENLABS, { markedDone: ['js-a'] }) });
      expect(await done).toBeFalse();
      expect(service.saved()).toBeNull();
    });
  });

  describe('content', () => {
    it('loads once and shares the result', async () => {
      const service = setup();
      const first = firstValueFrom(service.loadData());
      const second = firstValueFrom(service.loadData());
      http.expectOne(DATA_URL).flush(DATA);
      expect(await first).toEqual(DATA);
      expect(await second).toEqual(DATA);
      expect(await firstValueFrom(service.loadData())).toEqual(DATA);
    });

    it('gives null on failure and tries again next time', async () => {
      const service = setup();
      const failed = firstValueFrom(service.loadData());
      http.expectOne(DATA_URL).flush({}, { status: 503, statusText: 'Unavailable' });
      expect(await failed).toBeNull();

      const retried = firstValueFrom(service.loadData());
      http.expectOne(DATA_URL).flush(DATA);
      expect(await retried).toEqual(DATA);
    });

    it('rejects a file with an unknown shape', async () => {
      const service = setup();
      const result = firstValueFrom(service.loadData());
      http.expectOne(DATA_URL).flush({ schemaVersion: 99 });
      expect(await result).toBeNull();
    });

    it('builds the plan with passed rounds, solved tasks and hand marks', () => {
      const service = setup();
      const answers = { ...ELEVENLABS, when: 'later' as const };
      logIn(user('a', saved(answers, { passedRounds: ['elevenlabs/main/second'], markedDone: ['marked'] })));
      solvedIds.set(['done']);

      const plan = service.buildPlan(DATA, answers, '2026-11-02');
      const solved = plan.tasks.filter((task) => task.solved).map((task) => task.id);
      expect(solved.sort()).toEqual(['done', 'marked']);
      expect(plan.companies[0].rounds.find((round) => round.id === 'second')?.passed).toBeTrue();
      expect(plan.companies[0].rounds.find((round) => round.id === 'second')?.tasks).toEqual([]);
    });
  });

  describe('measurement', () => {
    it('sends events through one place', () => {
      const service = setup();
      service.track('company_plan_build_clicked', { when: 'next-week' });
      expect(analytics.track).toHaveBeenCalledOnceWith('company_plan_build_clicked', { when: 'next-week' });
    });

    it('counts an unlisted company by its cleaned name only', () => {
      const service = setup();
      service.trackUnlistedCompany('  Vercel, Inc. ');
      expect(analytics.track).toHaveBeenCalledOnceWith('company_plan_unlisted_company', { company_query: 'vercel inc.' });
    });

    it('drops anything that looks personal or like a sentence', () => {
      const service = setup();
      service.trackUnlistedCompany('me@example.com');
      service.trackUnlistedCompany('call me on 5551234567');
      service.trackUnlistedCompany('i am interviewing at a small startup');
      service.trackUnlistedCompany('x');
      expect(analytics.track).not.toHaveBeenCalled();
    });

    it('shortens and folds a long or accented name', () => {
      expect(cleanCompanyQuery('Société Générale')).toBe('societe generale');
      expect(cleanCompanyQuery('a'.repeat(60)).length).toBe(40);
      expect(cleanCompanyQuery('Booking.com')).toBe('booking.com');
    });
  });
});
