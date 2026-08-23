import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { FeIntroArticle } from './fe-intro-article.component';

describe('FeIntroArticle', () => {
  let fixture: ComponentFixture<FeIntroArticle>;
  let originalPath = '';

  beforeEach(async () => {
    originalPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.pushState({}, '', '/guides/interview-blueprint/intro');

    await TestBed.configureTestingModule({
      imports: [FeIntroArticle],
      providers: [
        provideRouter([]),
        {
          provide: AnalyticsService,
          useValue: jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeIntroArticle);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
    window.history.pushState({}, '', originalPath || '/');
  });

  it('renders the hiring process as semantic HTML without visible Markdown syntax', () => {
    const host = fixture.nativeElement as HTMLElement;
    const process = host.querySelector('[data-testid="frontend-interview-hiring-process"]') as HTMLOListElement | null;
    const onsiteRounds = host.querySelector('[data-testid="frontend-interview-onsite-rounds"]') as HTMLUListElement | null;
    const processText = (process?.textContent || '').replace(/\s+/g, ' ').trim();
    const processSteps = Array.from(process?.children || []).filter((child) => child.tagName === 'LI');

    expect(process).not.toBeNull();
    expect(processSteps.length).toBe(4);
    expect(onsiteRounds?.querySelectorAll('li').length).toBe(3);
    expect(onsiteRounds?.textContent || '').toContain('Coding:');
    expect(onsiteRounds?.textContent || '').toContain('System design:');
    expect(onsiteRounds?.textContent || '').toContain('Behavioral:');
    expect(process?.querySelector('em')?.textContent?.trim()).toBe('raw coding ability');
    expect(processText).not.toContain('**Coding**');
    expect(processText).not.toContain('*raw coding ability*');
    expect((host.textContent || '').replace(/\s+/g, ' ')).not.toContain('*use it*');
  });
});
