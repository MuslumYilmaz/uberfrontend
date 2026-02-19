import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { ActivityService } from '../../../core/services/activity.service';
import { AuthService } from '../../../core/services/auth.service';
import { BugReportService } from '../../../core/services/bug-report.service';
import { CodeStorageService } from '../../../core/services/code-storage.service';
import { DailyService } from '../../../core/services/daily.service';
import { QuestionService } from '../../../core/services/question.service';
import { SeoService } from '../../../core/services/seo.service';
import { UserProgressService } from '../../../core/services/user-progress.service';
import { CodingDetailComponent } from './coding-detail.component';

describe('CodingDetailComponent', () => {
  let questionService: jasmine.SpyObj<QuestionService>;
  let dailyService: jasmine.SpyObj<DailyService>;
  let bugReport: jasmine.SpyObj<BugReportService>;

  beforeEach(async () => {
    questionService = jasmine.createSpyObj<QuestionService>('QuestionService', ['loadQuestions']);
    dailyService = jasmine.createSpyObj<DailyService>('DailyService', ['ensureTodaySet']);
    bugReport = jasmine.createSpyObj<BugReportService>('BugReportService', ['open']);

    await TestBed.configureTestingModule({
      imports: [CodingDetailComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: QuestionService, useValue: questionService },
        { provide: DailyService, useValue: dailyService },
        { provide: ActivityService, useValue: {} },
        { provide: SeoService, useValue: { updateTags: () => {}, buildCanonicalUrl: (v: string) => v } },
        {
          provide: CodeStorageService,
          useValue: { migrateAllJsToIndexedDbOnce: () => Promise.resolve() },
        },
        { provide: UserProgressService, useValue: { solvedIds: () => [] } },
        {
          provide: AuthService,
          useValue: { user: () => null, isLoggedIn: () => false, ensureMe: () => of(null), headers: () => ({}) },
        },
        { provide: BugReportService, useValue: bugReport },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('delegates runTests to the JS panel for JS questions', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    component.tech = 'javascript';
    component.question.set({ id: 'q1' } as any);
    component.subTab.set('console');
    component.consoleEntries.set([{ level: 'log', message: 'old', timestamp: 1 } as any]);

    const runSpy = jasmine.createSpy('runTests').and.resolveTo();
    component.jsPanel = { runTests: runSpy } as any;

    await component.runTests();

    expect(runSpy).toHaveBeenCalled();
    expect(component.subTab()).toBe('tests');
    expect(component.consoleEntries().length).toBe(0);
  });

  it('does not run JS tests for web questions', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    component.tech = 'html';
    component.question.set({ id: 'q1', access: 'free' } as any);
    const runSpy = jasmine.createSpy('runTests').and.resolveTo();
    component.jsPanel = { runTests: runSpy } as any;

    await component.runTests();

    expect(runSpy).not.toHaveBeenCalled();
    expect(component.subTab()).toBe('tests');
  });

  it('opens bug report flow from coding detail action', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    component.tech = 'javascript';
    component.question.set({ id: 'q1', title: 'Two Sum' } as any);

    component.reportIssue();

    expect(bugReport.open).toHaveBeenCalledWith(jasmine.objectContaining({
      source: 'coding_detail',
      tech: 'javascript',
      questionId: 'q1',
      questionTitle: 'Two Sum',
    }));
  });

  it('opens bug report flow from coding locked action', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    component.tech = 'javascript';
    component.question.set({ id: 'q1', title: 'Two Sum' } as any);

    component.reportAccessIssue();

    expect(bugReport.open).toHaveBeenCalledWith(jasmine.objectContaining({
      source: 'coding_locked',
      tech: 'javascript',
      questionId: 'q1',
      questionTitle: 'Two Sum',
    }));
  });

  it('navigates back using returnToUrl when available', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigateByUrl');

    (component as any).returnToUrl = '/coding?tech=javascript';
    (component as any).returnTo = null;
    component.courseNav.set(null);

    component.backToReturn();
    expect(navSpy).toHaveBeenCalledWith('/coding?tech=javascript');
  });

  it('navigates back using course breadcrumb when provided', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigate');

    component.courseNav.set({
      breadcrumb: { to: ['/courses', 'frontend'], label: 'Course' },
      prev: null,
      next: null,
    });

    component.backToReturn();
    expect(navSpy).toHaveBeenCalledWith(['/courses', 'frontend']);
  });

  it('initializes direct question flow and loads questions', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.questionId = 'q1';
    component.questionTech = 'javascript';

    questionService.loadQuestions.and.returnValue(of([{ id: 'q1', title: 'Title', access: 'free' } as any]));
    const loadSpy = spyOn(component as any, 'loadQuestion').and.resolveTo();

    component.ngOnInit();

    expect(dailyService.ensureTodaySet).toHaveBeenCalledWith('javascript' as any);
    expect(questionService.loadQuestions).toHaveBeenCalledWith('javascript', 'coding');
    expect(loadSpy).toHaveBeenCalledWith('q1');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores document overflow on destroy', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.questionId = 'q1';
    component.questionTech = 'javascript';

    questionService.loadQuestions.and.returnValue(of([{ id: 'q1', title: 'Title', access: 'free' } as any]));
    spyOn(component as any, 'loadQuestion').and.resolveTo();

    component.ngOnInit();
    expect(document.body.style.overflow).toBe('hidden');

    component.ngOnDestroy();
    expect(document.body.style.overflow).toBe('');
  });
});
