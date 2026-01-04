import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { ActivityService } from '../../../core/services/activity.service';
import { AuthService } from '../../../core/services/auth.service';
import { CodeStorageService } from '../../../core/services/code-storage.service';
import { DailyService } from '../../../core/services/daily.service';
import { QuestionService } from '../../../core/services/question.service';
import { SeoService } from '../../../core/services/seo.service';
import { UserProgressService } from '../../../core/services/user-progress.service';
import { CodingDetailComponent } from './coding-detail.component';

describe('CodingDetailComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodingDetailComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: QuestionService, useValue: {} },
        { provide: DailyService, useValue: {} },
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
      ],
    }).compileComponents();
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
});
