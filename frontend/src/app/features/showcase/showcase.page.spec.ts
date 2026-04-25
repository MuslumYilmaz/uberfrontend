import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { IncidentService } from '../../core/services/incident.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { BillingCheckoutService } from '../../core/services/billing-checkout.service';
import { ExperimentService } from '../../core/services/experiment.service';
import { QuestionService } from '../../core/services/question.service';
import { TradeoffBattleService } from '../../core/services/tradeoff-battle.service';
import { PrepRoadmapComponent } from '../../shared/components/prep-roadmap/prep-roadmap.component';
import { ShowcasePageComponent } from './showcase.page';

describe('ShowcasePageComponent', () => {
  let fixture: ComponentFixture<ShowcasePageComponent>;
  let analytics: jasmine.SpyObj<AnalyticsService>;

  beforeEach(async () => {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);

    await TestBed.configureTestingModule({
      imports: [ShowcasePageComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({}),
            },
          },
        },
        { provide: HttpClient, useValue: jasmine.createSpyObj<HttpClient>('HttpClient', ['post']) },
        { provide: AnalyticsService, useValue: analytics },
        {
          provide: BillingCheckoutService,
          useValue: {
            getCheckoutConfig: jasmine.createSpy('getCheckoutConfig').and.resolveTo({ enabled: false, plans: null }),
          },
        },
        {
          provide: ExperimentService,
          useValue: {
            variant: jasmine.createSpy('variant').and.returnValue('control'),
            expose: jasmine.createSpy('expose'),
          },
        },
        {
          provide: QuestionService,
          useValue: {
            loadShowcaseStats: jasmine.createSpy('loadShowcaseStats').and.returnValue(of({ totalQuestions: 0, companyCounts: {} })),
          },
        },
        {
          provide: IncidentService,
          useValue: {
            loadIncidentIndex: jasmine.createSpy('loadIncidentIndex').and.returnValue(of([])),
          },
        },
        {
          provide: TradeoffBattleService,
          useValue: {
            loadIndex: jasmine.createSpy('loadIndex').and.returnValue(of([])),
            loadScenario: jasmine.createSpy('loadScenario').and.returnValue(of(null)),
          },
        },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    })
      .overrideComponent(ShowcasePageComponent, {
        set: {
          imports: [CommonModule, FormsModule, RouterModule, PrepRoadmapComponent],
          schemas: [NO_ERRORS_SCHEMA],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ShowcasePageComponent);
    fixture.componentInstance.sectionVisible = {
      reasoning: true,
      library: true,
      company: true,
      capabilities: true,
      tracks: true,
      faq: true,
      contact: true,
    };
    fixture.detectChanges();
  });

  it('uses the preparation guide as the hero primary CTA and keeps Essential 60 secondary', () => {
    const page: HTMLElement = fixture.nativeElement;
    const primaryCta = page.querySelector('[data-testid="showcase-hero-primary-cta"]') as HTMLAnchorElement;
    const secondaryCta = page.querySelector('[data-testid="showcase-hero-secondary-cta"]') as HTMLAnchorElement;
    const helper = page.querySelector('[data-testid="showcase-hero-helper"]') as HTMLElement;

    expect(primaryCta.textContent?.trim()).toBe('Start with the guide');
    expect(primaryCta.getAttribute('href') || '').toContain('/guides/interview-blueprint/intro');
    expect(secondaryCta.textContent?.trim()).toBe('Open Essential 60');
    expect(secondaryCta.getAttribute('href') || '').toContain('/interview-questions/essential');
    expect(helper.textContent).toContain('New here? Start with the interview preparation guide.');

    primaryCta.click();

    expect(analytics.track).toHaveBeenCalledWith(
      'lp_primary_cta_clicked',
      jasmine.objectContaining({
        src: 'lp_hero',
        destination: 'interview_blueprint',
        route: '/guides/interview-blueprint/intro',
        start_path_variant: 'guide_first',
      }),
    );

    secondaryCta.click();

    expect(analytics.track).toHaveBeenCalledWith(
      'lp_secondary_cta_clicked',
      jasmine.objectContaining({
        src: 'lp_hero',
        destination: 'essential_60',
        route: '/interview-questions/essential',
        start_path_variant: 'guide_first',
      }),
    );
  });

  it('removes the floating chip cloud, keeps the hero proof static on first render, and reinforces the next-step path below the fold', () => {
    const page: HTMLElement = fixture.nativeElement;
    const component = fixture.componentInstance;
    const pageText = page.textContent || '';
    const startPath = page.querySelector('[data-testid="showcase-start-path"]') as HTMLElement;
    const libraryCta = Array.from(page.querySelectorAll('a')).find((link) =>
      (link.textContent || '').includes('Browse Full Question Library'),
    ) as HTMLAnchorElement | undefined;

    expect(page.querySelector('.chip-cloud')).toBeNull();
    expect(component.activeFlowIndex).toBe(0);
    expect(startPath.textContent).toContain('Preparation guide');
    expect(startPath.textContent).toContain('Essential 60');
    expect(startPath.textContent).toContain('Question Library');
    expect(startPath.textContent).toContain('Study Plans / Framework Prep');
    expect(startPath.textContent).toContain('final-round coverage');
    expect(pageText).toContain('Start with the interview preparation guide');
    expect(libraryCta).toBeTruthy();
    expect(libraryCta?.getAttribute('href') || '').toContain('/coding?reset=1');
  });

  it('places the interactive demo before the recommended preparation roadmap', () => {
    const page: HTMLElement = fixture.nativeElement;
    const heroTitle = page.querySelector('[data-testid="showcase-hero-title"]') as HTMLElement;
    const demoTitle = page.querySelector('#demo-title') as HTMLElement;
    const roadmap = page.querySelector('[data-testid="prep-roadmap"]') as HTMLElement;
    const comesBefore = (left: HTMLElement, right: HTMLElement) =>
      Boolean(left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING);

    expect(heroTitle).toBeTruthy();
    expect(demoTitle).toBeTruthy();
    expect(roadmap).toBeTruthy();
    expect(comesBefore(heroTitle, demoTitle)).toBeTrue();
    expect(comesBefore(demoTitle, roadmap)).toBeTrue();
  });

  it('renders the recommended preparation roadmap with the intended first route and links', () => {
    const page: HTMLElement = fixture.nativeElement;
    const roadmap = page.querySelector('[data-testid="prep-roadmap"]') as HTMLElement;
    const firstItem = page.querySelector('[data-testid="prep-roadmap-item-1"]') as HTMLAnchorElement;
    const secondItem = page.querySelector('[data-testid="prep-roadmap-item-2"]') as HTMLAnchorElement;
    const thirdItem = page.querySelector('[data-testid="prep-roadmap-item-3"]') as HTMLAnchorElement;
    const fourthItem = page.querySelector('[data-testid="prep-roadmap-item-4"]') as HTMLAnchorElement;
    const fifthItem = page.querySelector('[data-testid="prep-roadmap-item-5"]') as HTMLAnchorElement;

    expect(roadmap).toBeTruthy();
    expect(page.querySelectorAll('[data-testid^="prep-roadmap-item-"]').length).toBe(5);
    expect(roadmap.textContent || '').not.toContain('Try one real challenge');
    expect(firstItem.textContent).toContain('Frontend interview preparation guide');
    expect(firstItem.textContent).toContain('Start here');
    expect(firstItem.getAttribute('href') || '').toContain('/guides/interview-blueprint/intro');
    expect(secondItem.textContent).toContain('FrontendAtlas Essential 60');
    expect(secondItem.getAttribute('href') || '').toContain('/interview-questions/essential');
    expect(thirdItem.textContent).toContain('Broaden with Question Library');
    expect(thirdItem.getAttribute('href') || '').toContain('/coding?reset=1');
    expect(fourthItem.textContent).toContain('Move into Study Plans / Framework Prep');
    expect(fourthItem.getAttribute('href') || '').toContain('/tracks');
    expect(fifthItem.textContent).toContain('Add final-round coverage');
    expect(fifthItem.getAttribute('href') || '').toContain('/system-design');
  });
});
