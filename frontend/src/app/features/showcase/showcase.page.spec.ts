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

  it('uses Essential 60 as the hero primary CTA and keeps the prep guide secondary', () => {
    const page: HTMLElement = fixture.nativeElement;
    const primaryCta = page.querySelector('[data-testid="showcase-hero-primary-cta"]') as HTMLAnchorElement;
    const secondaryCta = page.querySelector('[data-testid="showcase-hero-secondary-cta"]') as HTMLAnchorElement;
    const helper = page.querySelector('[data-testid="showcase-hero-helper"]') as HTMLElement;

    expect(primaryCta.textContent?.trim()).toBe('Open Essential 60');
    expect(primaryCta.getAttribute('href') || '').toContain('/interview-questions/essential');
    expect(secondaryCta.textContent?.trim()).toBe('View prep guide');
    expect(secondaryCta.getAttribute('href') || '').toContain('/guides/interview-blueprint/intro');
    expect(helper.textContent).toContain('Not sure how interviews are evaluated? Read the prep guide first.');

    primaryCta.click();

    expect(analytics.track).toHaveBeenCalledWith(
      'lp_primary_cta_clicked',
      jasmine.objectContaining({
        src: 'lp_hero',
        destination: 'essential_60',
        route: '/interview-questions/essential',
        start_path_variant: 'essential_first',
      }),
    );

    secondaryCta.click();

    expect(analytics.track).toHaveBeenCalledWith(
      'lp_secondary_cta_clicked',
      jasmine.objectContaining({
        src: 'lp_hero',
        destination: 'interview_blueprint',
        route: '/guides/interview-blueprint/intro',
        start_path_variant: 'essential_first',
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
    expect(startPath.textContent).toContain('Essential 60');
    expect(startPath.textContent).toContain('Question Library');
    expect(startPath.textContent).toContain('Study Plans / Framework Prep');
    expect(startPath.textContent).toContain('final-round coverage');
    expect(startPath.textContent).toContain('New to interviews? Read the prep guide first.');
    expect(pageText).toContain('Start with FrontendAtlas Essential 60');
    expect(pageText.toLowerCase()).not.toContain('prep graph');
    expect(pageText.toLowerCase()).not.toContain('company-flavored');
    expect(pageText.toLowerCase()).not.toContain('your own prompts');
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

  it('renders the interviewer-informed trust section after the roadmap without profile links', () => {
    const page: HTMLElement = fixture.nativeElement;
    const heroTitle = page.querySelector('[data-testid="showcase-hero-title"]') as HTMLElement;
    const trustSection = page.querySelector('[data-testid="showcase-trust-section"]') as HTMLElement;
    const demoTitle = page.querySelector('#demo-title') as HTMLElement;
    const roadmap = page.querySelector('[data-testid="prep-roadmap"]') as HTMLElement;
    const proofRow = page.querySelector('.proof-row') as HTMLElement;
    const trustText = trustSection.textContent || '';
    const comesBefore = (left: HTMLElement, right: HTMLElement) =>
      Boolean(left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING);

    expect(trustSection).toBeTruthy();
    expect(trustSection.querySelector('a')).toBeNull();
    expect(proofRow.textContent).toContain('Interviewer-informed');
    expect(trustText).toContain('Interview prep shaped around what interviewers can actually evaluate.');
    expect(trustText).toContain('senior frontend engineer');
    expect(trustText).toContain('8+ years building production frontend');
    expect(trustText).toContain('interviewer-side experience');
    expect(trustText).toContain('Early-stage and transparent: no inflated user counts, invented customer logos, or anonymous praise.');
    expect(trustText).toContain('Interviewer-informed prompts');
    expect(trustText).toContain('Practice questions selected for observable interview signals, not trivia volume.');
    expect(trustText).toContain('Code, preview, test, and review in the same loop you use when building real UI.');
    expect(trustText).toContain('Train edge cases, accessibility, performance, and tradeoffs so you can defend your choices clearly.');
    expect(trustText).toContain('Independent, interviewer-informed frontend interview prep.');
    expect(comesBefore(heroTitle, demoTitle)).toBeTrue();
    expect(comesBefore(demoTitle, roadmap)).toBeTrue();
    expect(comesBefore(roadmap, trustSection)).toBeTrue();
  });

  it('renders the recommended preparation roadmap with the intended first route and links', () => {
    const page: HTMLElement = fixture.nativeElement;
    const roadmap = page.querySelector('[data-testid="prep-roadmap"]') as HTMLElement;
    const firstItem = page.querySelector('[data-testid="prep-roadmap-item-1"]') as HTMLAnchorElement;
    const secondItem = page.querySelector('[data-testid="prep-roadmap-item-2"]') as HTMLAnchorElement;
    const thirdItem = page.querySelector('[data-testid="prep-roadmap-item-3"]') as HTMLAnchorElement;
    const fourthItem = page.querySelector('[data-testid="prep-roadmap-item-4"]') as HTMLAnchorElement;

    expect(roadmap).toBeTruthy();
    expect(page.querySelectorAll('[data-testid^="prep-roadmap-item-"]').length).toBe(4);
    expect(roadmap.textContent || '').not.toContain('Try one real challenge');
    expect(firstItem.textContent).toContain('FrontendAtlas Essential 60');
    expect(firstItem.textContent).toContain('Recommended start');
    expect(firstItem.getAttribute('href') || '').toContain('/interview-questions/essential');
    expect(secondItem.textContent).toContain('Question Library');
    expect(secondItem.getAttribute('href') || '').toContain('/coding?reset=1');
    expect(thirdItem.textContent).toContain('Study Plans / Framework Prep');
    expect(thirdItem.getAttribute('href') || '').toContain('/tracks');
    expect(fourthItem.textContent).toContain('Final-round coverage');
    expect(fourthItem.getAttribute('href') || '').toContain('/coding?view=formats&category=system');
  });
});
