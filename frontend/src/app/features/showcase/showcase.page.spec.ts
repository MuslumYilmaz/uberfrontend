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
          imports: [CommonModule, FormsModule, RouterModule],
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

  it('uses Essential 60 as the hero primary CTA and keeps the free challenge secondary', () => {
    const page: HTMLElement = fixture.nativeElement;
    const primaryCta = page.querySelector('[data-testid="showcase-hero-primary-cta"]') as HTMLAnchorElement;
    const secondaryCta = page.querySelector('[data-testid="showcase-hero-secondary-cta"]') as HTMLAnchorElement;
    const helper = page.querySelector('[data-testid="showcase-hero-helper"]') as HTMLElement;

    expect(primaryCta.textContent?.trim()).toBe('Start Essential 60');
    expect(primaryCta.getAttribute('href') || '').toContain('/interview-questions/essential');
    expect(secondaryCta.textContent?.trim()).toBe('Try 2-minute challenge');
    expect(secondaryCta.getAttribute('href') || '').toContain('/react/coding/react-counter');
    expect(helper.textContent).toContain('New here? Start with Essential 60.');

    primaryCta.click();

    expect(analytics.track).toHaveBeenCalledWith(
      'lp_primary_cta_clicked',
      jasmine.objectContaining({
        src: 'lp_hero',
        destination: 'essential_60',
        route: '/interview-questions/essential',
        start_path_variant: 'essential_60_first',
      }),
    );

    secondaryCta.click();

    expect(analytics.track).toHaveBeenCalledWith(
      'lp_secondary_cta_clicked',
      jasmine.objectContaining({
        src: 'lp_hero',
        destination: 'free_challenge',
        route: '/react/coding/react-counter',
        start_path_variant: 'essential_60_first',
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
    expect(startPath.textContent).toContain('FrontendAtlas Essential 60');
    expect(startPath.textContent).toContain('2-minute challenge');
    expect(startPath.textContent).toContain('Full Question Library / Study Plans');
    expect(pageText).toContain('Start with FrontendAtlas Essential 60');
    expect(libraryCta).toBeTruthy();
    expect(libraryCta?.getAttribute('href') || '').toContain('/coding?reset=1');
  });
});
