import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { catchError, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { CompanyPlanAnswers, SavedCompanyPlan } from '../../../core/models/company-plan.model';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService, User } from '../../../core/services/auth.service';
import { PracticeAssetResolverService } from '../../../core/services/practice-asset-resolver.service';
import { UserProgressService } from '../../../core/services/user-progress.service';
import { apiUrl } from '../../../core/utils/api-base';
import { COMPANY_PLAN_DRAFT_KEY, cleanCompanyPlanAnswers } from './company-plan-draft';
import { CompanyPlan, CompanyPlanData, buildCompanyPlan } from './company-plan.engine';

const DATA_PATH = 'questions/company-plan-data.json';
const MAX_QUERY_LENGTH = 40;
const MAX_QUERY_WORDS = 4;

export type CompanyPlanEvent =
  | 'company_plan_form_started'
  | 'company_plan_step_completed'
  | 'company_plan_preview_viewed'
  | 'company_plan_free_task_opened'
  | 'company_plan_build_clicked'
  | 'company_plan_opened'
  | 'company_plan_task_opened'
  | 'company_plan_resumed';

type PlanResponse = { companyPlan: SavedCompanyPlan };
type MarkKind = 'round' | 'task';

function sameAnswers(a: CompanyPlanAnswers, b: CompanyPlanAnswers): boolean {
  return JSON.stringify(cleanCompanyPlanAnswers(a)) === JSON.stringify(cleanCompanyPlanAnswers(b));
}

/**
 * A company name typed into the form, reduced to something safe to count. Anything that looks like personal data
 * or a sentence gives an empty string, and the result is never tied to a user.
 */
export function cleanCompanyQuery(text: string): string {
  if (typeof text !== 'string' || text.includes('@') || /\d{5,}/.test(text)) return '';
  const cleaned = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 .&+-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length < 2 || cleaned.split(' ').length > MAX_QUERY_WORDS) return '';
  return cleaned.slice(0, MAX_QUERY_LENGTH);
}

@Injectable({ providedIn: 'root' })
export class CompanyPlanService {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly assets = inject(PracticeAssetResolverService);
  private readonly analytics = inject(AnalyticsService);
  private readonly progress = inject(UserProgressService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly draftState = signal<CompanyPlanAnswers | null>(this.readDraft());
  private readonly savedState = signal<SavedCompanyPlan | null>(null);
  private readonly syncFailedState = signal(false);

  private userId: string | null = null;
  /** Bumped when the account changes, so a response for the previous account is dropped. */
  private accountGeneration = 0;
  /** Bumped per write, so an older response cannot overwrite a newer plan. */
  private writeSequence = 0;
  private syncing = false;
  private marksInFlight = 0;
  private data$: Observable<CompanyPlanData | null> | null = null;

  /** Answers not on an account yet: a guest's, or a save that failed. */
  readonly draft = this.draftState.asReadonly();
  /** The plan on the account. */
  readonly saved = this.savedState.asReadonly();
  /** The answers in use. The account wins, because a stored plan is never overwritten without asking. */
  readonly answers = computed<CompanyPlanAnswers | null>(() => this.savedState() ?? this.draftState());
  /** The last attempt to move a draft to the account failed. The draft is kept. */
  readonly syncFailed = this.syncFailedState.asReadonly();
  /** A draft differs from the account's plan, so a screen must ask before it replaces the plan. */
  readonly draftConflict = computed(() => {
    const draft = this.draftState();
    const saved = this.savedState();
    return Boolean(draft && saved && !sameAnswers(draft, saved));
  });

  private readonly followAccount = effect(() => {
    const user = this.auth.user();
    untracked(() => this.onUserChanged(user));
  });

  /** Keeps the answers as a draft, and on the account when there is one. */
  save(answers: CompanyPlanAnswers): Observable<'saved' | 'draft' | 'invalid'> {
    const clean = cleanCompanyPlanAnswers(answers);
    if (!clean) return of('invalid' as const);
    this.setDraft(clean);
    if (!this.auth.user()) return of('draft' as const);
    return this.writePlan(clean).pipe(
      map(() => 'saved' as const),
      catchError(() => of('draft' as const)),
    );
  }

  /** Tries again to move a draft to the account. A plan already there is left alone. */
  syncDraft(): void {
    const draft = this.draftState();
    if (!draft || !this.auth.user() || this.syncing) return;
    const saved = this.savedState();
    if (saved) {
      if (sameAnswers(draft, saved)) this.setDraft(null);
      return;
    }
    this.syncing = true;
    const generation = this.accountGeneration;
    this.writePlan(draft).subscribe({
      next: () => {
        if (generation === this.accountGeneration) this.syncing = false;
      },
      error: () => {
        if (generation === this.accountGeneration) this.syncing = false;
      },
    });
  }

  setRoundPassed(key: string, passed: boolean): Promise<boolean> {
    return this.mark('round', key, passed);
  }

  setTaskDone(id: string, done: boolean): Promise<boolean> {
    return this.mark('task', id, done);
  }

  /** The content a plan is built from, loaded on demand. Null on the server and when the request fails. */
  loadData(): Observable<CompanyPlanData | null> {
    if (!this.isBrowser) return of(null);
    if (!this.data$) {
      this.data$ = this.assets.getVersion().pipe(
        switchMap((version) => {
          const { primary, fallback } = this.assets.getAssetUrls(DATA_PATH, version);
          const request = this.http.get<CompanyPlanData>(primary);
          return primary === fallback ? request : request.pipe(catchError(() => this.http.get<CompanyPlanData>(fallback)));
        }),
        map((data) => {
          if (data?.schemaVersion !== 1) throw new Error('Unknown company plan data');
          return data;
        }),
        catchError(() => {
          this.data$ = null;
          return of(null);
        }),
        shareReplay(1),
      );
    }
    return this.data$;
  }

  /** The plan for these answers, with the account's passed rounds and every task the person has finished. */
  buildPlan(data: CompanyPlanData, answers: CompanyPlanAnswers, today = new Date().toISOString().slice(0, 10)): CompanyPlan {
    const saved = this.savedState();
    return buildCompanyPlan(data, {
      companies: answers.companies.map((company) => company.slug),
      lists: Object.fromEntries(answers.companies.flatMap((company) => (company.list ? [[company.slug, company.list]] : []))),
      when: answers.when,
      level: answers.level,
      // What the form stated wins over the marks on the account; without a statement the marks stand.
      passedRounds: answers.passedRounds ?? saved?.passedRounds ?? [],
      solvedTaskIds: [...this.progress.solvedIds(), ...(saved?.markedDone ?? [])],
      ...(answers.framework ? { framework: answers.framework } : {}),
      today,
    });
  }

  track(event: CompanyPlanEvent, params?: Record<string, unknown>): void {
    this.analytics.track(event, params);
  }

  /** Counts a company we have not mapped yet. Only the cleaned name is sent, with no answers beside it. */
  trackUnlistedCompany(query: string): void {
    const company = cleanCompanyQuery(query);
    if (company) this.analytics.track('company_plan_unlisted_company', { company_query: company });
  }

  private onUserChanged(user: User | null): void {
    const nextId = user?._id ?? null;
    if (nextId !== this.userId) {
      const hadAccount = this.userId !== null;
      this.userId = nextId;
      this.accountGeneration += 1;
      this.syncing = false;
      this.marksInFlight = 0;
      this.syncFailedState.set(false);
      // A draft left by one account must not reach the next one on this browser.
      if (hadAccount) this.setDraft(null);
      this.savedState.set(null);
    }
    if (!user) return;
    // A refreshed /me must not undo a mark the server has not answered yet.
    if (this.marksInFlight === 0) this.savedState.set(user.companyPlan ?? null);
    this.syncDraft();
  }

  private writePlan(answers: CompanyPlanAnswers): Observable<SavedCompanyPlan> {
    const sequence = ++this.writeSequence;
    const generation = this.accountGeneration;
    const sent = JSON.stringify(answers);
    return this.http.put<PlanResponse>(apiUrl('/users/me/company-plan'), answers, { headers: this.auth.headers() }).pipe(
      map((response) => response.companyPlan),
      tap((plan) => {
        if (generation !== this.accountGeneration) return;
        if (sequence === this.writeSequence) {
          this.applyPlan(plan);
          this.syncFailedState.set(false);
        }
        if (JSON.stringify(this.draftState()) === sent) this.setDraft(null);
      }),
      catchError((error: unknown) => {
        if (generation === this.accountGeneration && sequence === this.writeSequence) this.syncFailedState.set(true);
        return throwError(() => error);
      }),
    );
  }

  private async mark(kind: MarkKind, id: string, on: boolean): Promise<boolean> {
    const plan = this.savedState();
    if (!plan || !this.auth.user()) return false;

    const generation = this.accountGeneration;
    this.applyMark(kind, id, on);
    this.marksInFlight += 1;
    try {
      const response = await firstValueFrom(
        this.http.patch<PlanResponse>(apiUrl('/users/me/company-plan'), { kind, id, on }, { headers: this.auth.headers() }),
      );
      if (generation !== this.accountGeneration) return false;
      this.marksInFlight -= 1;
      // With another click still on its way, this answer is already out of date.
      if (this.marksInFlight === 0) this.applyPlan(response.companyPlan);
      return true;
    } catch {
      if (generation !== this.accountGeneration) return false;
      this.marksInFlight -= 1;
      this.applyMark(kind, id, !on);
      return false;
    }
  }

  private applyMark(kind: MarkKind, id: string, on: boolean): void {
    this.savedState.update((plan) => {
      if (!plan) return plan;
      const field = kind === 'round' ? 'passedRounds' : 'markedDone';
      const rest = plan[field].filter((value) => value !== id);
      return { ...plan, [field]: on ? [...rest, id] : rest };
    });
  }

  private applyPlan(plan: SavedCompanyPlan): void {
    this.savedState.set(plan);
    this.auth.user.update((user) => (user ? { ...user, companyPlan: plan } : user));
  }

  private readDraft(): CompanyPlanAnswers | null {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return null;
    try {
      const stored = localStorage.getItem(COMPANY_PLAN_DRAFT_KEY);
      if (!stored) return null;
      const draft = cleanCompanyPlanAnswers(JSON.parse(stored));
      if (!draft) localStorage.removeItem(COMPANY_PLAN_DRAFT_KEY);
      return draft;
    } catch {
      return null;
    }
  }

  private setDraft(draft: CompanyPlanAnswers | null): void {
    this.draftState.set(draft);
    if (!this.isBrowser) return;
    try {
      if (draft) localStorage.setItem(COMPANY_PLAN_DRAFT_KEY, JSON.stringify(draft));
      else localStorage.removeItem(COMPANY_PLAN_DRAFT_KEY);
    } catch {
      // Private windows can refuse storage. The draft still lives for this page.
    }
  }
}
