import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { IncidentService } from '../../core/services/incident.service';
import { PUBLIC_EDITORIAL_FACTS } from '../../core/content/public-editorial-facts';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ExperimentService } from '../../core/services/experiment.service';
import { QuestionService } from '../../core/services/question.service';
import { TradeoffBattleService } from '../../core/services/tradeoff-battle.service';
import { PrepRoadmapComponent } from '../../shared/components/prep-roadmap/prep-roadmap.component';
import { ShowcasePageComponent } from './showcase.page';

describe('ShowcasePageComponent', () => {
  let fixture: ComponentFixture<ShowcasePageComponent>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let http: jasmine.SpyObj<HttpClient>;

  beforeEach(async () => {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    http = jasmine.createSpyObj<HttpClient>('HttpClient', ['post']);

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
        { provide: HttpClient, useValue: http },
        { provide: AnalyticsService, useValue: analytics },
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

  it('uses the 30-day guided plan as the hero primary CTA and keeps the prep guide secondary', () => {
    const page: HTMLElement = fixture.nativeElement;
    const primaryCta = page.querySelector('[data-testid="showcase-hero-primary-cta"]') as HTMLAnchorElement;
    const secondaryCta = page.querySelector('[data-testid="showcase-hero-secondary-cta"]') as HTMLAnchorElement;
    const helper = page.querySelector('[data-testid="showcase-hero-helper"]') as HTMLElement;
    const conversionLinks = Array.from(page.querySelectorAll('.hero-conversion-links a')) as HTMLAnchorElement[];

    expect(primaryCta.textContent?.trim()).toBe('Start 30-day plan');
    expect(primaryCta.getAttribute('href') || '').toContain('/tracks/foundations-30d/preview');
    expect(secondaryCta.textContent?.trim()).toBe('View prep guide');
    expect(secondaryCta.getAttribute('href') || '').toContain('/guides/interview-blueprint/intro');
    expect(helper.textContent).toContain('Want a smaller first rep? Essential 60 is the compact practice block after the plan preview.');
    expect(conversionLinks.map((link) => (link.textContent || '').trim())).toEqual([
      'Create a free account',
      'Compare Premium plans',
    ]);
    expect(conversionLinks[1].getAttribute('href')).toBe('/pricing');

    primaryCta.click();

    expect(analytics.track).toHaveBeenCalledWith(
      'lp_primary_cta_clicked',
      jasmine.objectContaining({
        src: 'lp_hero',
        destination: 'foundations_30d_preview',
        route: '/tracks/foundations-30d/preview',
        start_path_variant: 'guided_plan_first',
      }),
    );

    secondaryCta.click();

    expect(analytics.track).toHaveBeenCalledWith(
      'lp_secondary_cta_clicked',
      jasmine.objectContaining({
        src: 'lp_hero',
        destination: 'interview_blueprint',
        route: '/guides/interview-blueprint/intro',
        start_path_variant: 'guided_plan_first',
      }),
    );
  });

  it('requires a fresh verification token before posting the contact form', async () => {
    const component = fixture.componentInstance;
    component.contact = {
      name: 'Alex Frontend',
      email: 'alex@example.com',
      topic: 'general',
      message: 'I need help with a practice question.',
      website: '',
    };

    await component.submitContact();

    expect(http.post).not.toHaveBeenCalled();
    expect(component.contactStatus).toBeNull();
    expect(component.contactSubmitLabel()).toBe('Complete verification to send');
  });

  it('sends the verification and honeypot fields, then clears successful contact state', async () => {
    const component = fixture.componentInstance;
    const reset = jasmine.createSpy('reset');
    component.contactTurnstile = { reset } as any;
    component.contact = {
      name: ' Alex Frontend ',
      email: ' alex@example.com ',
      topic: 'feature',
      message: ' Please add more debugging incidents. ',
      website: '',
    };
    component.onContactTokenChange('verified-token');
    http.post.and.returnValue(of(''));

    await component.submitContact();

    expect(http.post).toHaveBeenCalled();
    const [requestUrl, requestBody, requestOptions] = http.post.calls.mostRecent().args as any[];
    expect(requestUrl).toMatch(/\/contact$/);
    expect(requestBody).toEqual(jasmine.objectContaining({
      name: 'Alex Frontend',
      email: 'alex@example.com',
      topic: 'feature',
      message: 'Please add more debugging incidents.',
      website: '',
      verificationToken: 'verified-token',
    }));
    expect(requestOptions).toEqual({ responseType: 'text' });
    expect(component.contact).toEqual({
      name: '',
      email: '',
      topic: 'general',
      message: '',
      website: '',
    });
    expect(component.contactVerificationToken).toBe('');
    expect(reset).toHaveBeenCalled();
    expect(component.contactStatus?.tone).toBe('success');
  });

  it('preserves typed contact data and honors Retry-After after a rate-limit response', async () => {
    const component = fixture.componentInstance;
    const reset = jasmine.createSpy('reset');
    component.contactTurnstile = { reset } as any;
    component.contact = {
      name: 'Alex Frontend',
      email: 'alex@example.com',
      topic: 'billing',
      message: 'Please help me understand my billing status.',
      website: '',
    };
    component.onContactTokenChange('verified-token');
    http.post.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 429,
      error: { code: 'FORM_RATE_LIMITED', error: 'Too many messages' },
      headers: new HttpHeaders({ 'Retry-After': '17' }),
    })));

    await component.submitContact();

    expect(component.contact.message).toBe('Please help me understand my billing status.');
    expect(component.contactCooldownSeconds).toBe(17);
    expect(component.contactStatus?.text).toContain('17s');
    expect(component.contactVerificationToken).toBe('');
    expect(reset).toHaveBeenCalled();
  });

  it('counts a contact Retry-After cooldown down to zero in the browser', fakeAsync(() => {
    const component = fixture.componentInstance;
    Object.defineProperty(component, 'isBrowser', { value: true });

    (component as any).startContactCooldown(2);
    expect(component.contactCooldownSeconds).toBe(2);

    tick(1100);
    expect(component.contactCooldownSeconds).toBe(1);

    tick(1100);
    expect(component.contactCooldownSeconds).toBe(0);
  }));

  it('maps a text-mode JSON verification rejection to the accessible form message', async () => {
    const component = fixture.componentInstance;
    component.contactTurnstile = { reset: jasmine.createSpy('reset') } as any;
    component.contact = {
      name: 'Alex Frontend',
      email: 'alex@example.com',
      topic: 'general',
      message: 'This message uses a provider-rejected verification token.',
      website: '',
    };
    component.onContactTokenChange('rejected-token');
    http.post.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 403,
      error: JSON.stringify({
        code: 'FORM_VERIFICATION_FAILED',
        error: 'Verification failed.',
      }),
    })));

    await component.submitContact();

    expect(component.contact.message).toContain('provider-rejected');
    expect(component.contactStatus?.text).toBe(
      'We could not verify this submission. Please complete the verification and try again.',
    );
  });

  it('fails closed with a direct-email fallback when verification cannot load', () => {
    const component = fixture.componentInstance;
    const reset = jasmine.createSpy('reset');
    component.contactTurnstile = { reset } as any;
    component.contact = {
      name: 'Alex Frontend',
      email: 'alex@example.com',
      topic: 'bug',
      message: 'Keep this message while verification retries.',
      website: '',
    };

    component.onContactChallengeStateChange('error');
    fixture.detectChanges();
    component.contactTurnstile = { reset } as any;

    expect(component.contactVerificationToken).toBe('');
    expect(component.contactStatus).toBeNull();
    expect(component.contactSubmitLabel()).toBe('Verification unavailable');
    const alert = fixture.nativeElement.querySelector('[data-testid="showcase-contact-challenge-alert"]') as HTMLElement;
    const submit = fixture.nativeElement.querySelector('[data-testid="showcase-contact-submit"]') as HTMLButtonElement;
    expect(alert.getAttribute('role')).toBe('alert');
    expect(alert.textContent || '').toContain('Your message has been preserved');
    expect(alert.querySelector('a')?.getAttribute('href')).toBe('mailto:support@frontendatlas.com');
    expect(submit.disabled).toBeTrue();

    component.retryContactVerification();
    expect(reset).toHaveBeenCalled();
    expect(component.contact.message).toBe('Keep this message while verification retries.');

    component.onContactTokenChange('replacement-token');
    component.onContactChallengeStateChange('verified');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="showcase-contact-challenge-alert"]')).toBeNull();
    expect(component.contactSubmitLabel()).toBe('Send message');
  });

  it('keeps verification expiry separate from submission results and preserves the form', () => {
    const component = fixture.componentInstance;
    component.contact = {
      name: 'Alex Frontend',
      email: 'alex@example.com',
      topic: 'general',
      message: 'Preserve this expired verification draft.',
      website: '',
    };
    component.contactStatus = { tone: 'error', text: 'A prior network request failed.' };
    component.onContactTokenChange('old-token');

    component.onContactChallengeStateChange('expired');
    fixture.detectChanges();

    expect(component.contactVerificationToken).toBe('');
    expect(component.contactStatus?.text).toBe('A prior network request failed.');
    expect(component.contact.message).toBe('Preserve this expired verification draft.');
    expect(component.contactSubmitLabel()).toBe('Verification expired');
    expect(fixture.nativeElement.querySelector('[data-testid="showcase-contact-challenge-alert"]')).toBeTruthy();
  });

  it('defers template challenge state updates beyond the current change-detection turn', fakeAsync(() => {
    const component = fixture.componentInstance;

    component.onContactChallengeStateChangeDeferred('error');
    expect(component.contactChallengeState).toBe('idle');

    flushMicrotasks();
    expect(component.contactChallengeState).toBe('error');
    expect(component.contactVerificationToken).toBe('');
  }));

  it('renders a semantic support card with email, response time, and bug-report guidance', () => {
    const aside = fixture.nativeElement.querySelector('aside[aria-label="Support information"]') as HTMLElement;

    expect(aside).toBeTruthy();
    expect(aside.getAttribute('aria-hidden')).toBeNull();
    expect(aside.querySelector('a')?.getAttribute('href')).toBe('mailto:support@frontendatlas.com');
    expect(aside.textContent || '').toContain('1–2 business days');
    expect(Array.from(aside.querySelectorAll('li'), (item: Element) => item.textContent?.trim())).toEqual([
      'The page URL',
      'A screenshot or short recording',
      'Your browser and operating system',
    ]);
  });

  it('omits demo controls and component activation from the mobile DOM', () => {
    const component = fixture.componentInstance;
    Object.defineProperty(component, 'isBrowser', { value: true });
    component.showMobileCodingGuard = true;

    component.activateDemo();
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('.demo-picker')).toBeNull();
    expect(page.querySelector('.demo-meta')).toBeNull();
    expect(page.querySelector('#demo-pane')).toBeNull();
    expect(page.querySelectorAll('[data-testid^="showcase-demo-tab-"]').length).toBe(0);
    expect(page.querySelector('[data-testid="showcase-demo-mobile-guard-open"]')?.getAttribute('href')).toBe('/coding');
    expect(component.demoLoading).toBeFalse();
    expect(component.demoComponent).toBeUndefined();
  });

  it('groups the homepage into nine ordered outer landmarks without dropping core routes', () => {
    const page = fixture.nativeElement as HTMLElement;
    const landmarks = Array.from(page.querySelectorAll<HTMLElement>('[data-showcase-landmark]'));

    expect(landmarks.map((item) => item.dataset['showcaseLandmark'])).toEqual([
      'hero',
      'demo',
      'preparation',
      'trust',
      'practice',
      'browse',
      'cv',
      'pricing',
      'support',
    ]);
    const preparation = landmarks[2];
    const browse = landmarks[5];
    const support = landmarks[8];
    expect(preparation.querySelector('[data-testid="showcase-focus-section"]')).toBeTruthy();
    expect(preparation.querySelector('a[href="/tracks/crash-7d/preview"]')).toBeTruthy();
    expect(preparation.querySelector('a[href="/tracks/foundations-30d/preview"]')).toBeTruthy();
    expect(browse.querySelector('[data-testid="showcase-company-section"]')).toBeTruthy();
    expect(browse.querySelector('a[href="/coding"]')).toBeTruthy();
    expect(support.querySelector('[data-testid="showcase-contact-form"]')).toBeTruthy();
    expect(support.querySelector('a[href="/interview-questions/essential"]')).toBeTruthy();
    expect(support.querySelector('a[href="/guides/interview-blueprint/intro"]')).toBeTruthy();
    expect(page.querySelectorAll('h1').length).toBe(1);
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
    expect(startPath.textContent).toContain('30-day guided plan');
    expect(startPath.textContent).toContain('Essential 60');
    expect(startPath.textContent).toContain('machine coding');
    expect(startPath.textContent).toContain('Question Library');
    expect(startPath.textContent).toContain('final-round coverage');
    expect(startPath.textContent).toContain('New to interviews? Read the prep guide first.');
    expect(pageText).toContain('Start with a guided frontend interview study plan');
    expect(pageText.toLowerCase()).not.toContain('prep graph');
    expect(pageText.toLowerCase()).not.toContain('company-flavored');
    expect(pageText.toLowerCase()).not.toContain('your own prompts');
    expect(libraryCta).toBeTruthy();
    expect(libraryCta?.getAttribute('href') || '').toBe('/coding');
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

  it('labels homepage company cards as editorial practice groupings', () => {
    const page: HTMLElement = fixture.nativeElement;
    const lead = page.querySelector('.company-lede') as HTMLElement;
    const disclaimer = page.querySelector('[data-testid="company-practice-disclaimer"]') as HTMLElement;

    expect(lead.textContent?.trim()).toBe(
      'A few FrontendAtlas editorial practice groupings across UI, JavaScript, and system design.',
    );
    expect(disclaimer.textContent?.trim()).toBe(
      'Editorial practice groupings, not verified official interview questions or endorsements.',
    );
    expect(lead.contains(disclaimer)).toBeFalse();
    expect(page.textContent || '').not.toContain('known questions');
  });

  it('keeps company preview links aligned when prompt counts are unavailable', () => {
    fixture.componentInstance.companyCounts = {};
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const cards = Array.from(page.querySelectorAll<HTMLElement>('[data-testid="showcase-company-card"]'));

    expect(cards.length).toBe(4);
    for (const card of cards) {
      expect(card.querySelector('.company-count')).toBeNull();
      expect(card.querySelector('.company-card__footer')).toBeTruthy();
      expect(card.querySelector<HTMLAnchorElement>('.company-link')?.getAttribute('href')).toContain('/companies/');
    }
  });

  it('renders product proof, the secondary account milestone, and canonical editorial facts after the roadmap', () => {
    const page: HTMLElement = fixture.nativeElement;
    const heroTitle = page.querySelector('[data-testid="showcase-hero-title"]') as HTMLElement;
    const trustSection = page.querySelector('[data-testid="showcase-trust-section"]') as HTMLElement;
    const demoTitle = page.querySelector('#demo-title') as HTMLElement;
    const roadmap = page.querySelector('[data-testid="prep-roadmap"]') as HTMLElement;
    const focusSection = page.querySelector('[data-testid="showcase-focus-section"]') as HTMLElement;
    const proofRow = page.querySelector('.proof-row') as HTMLElement;
    const trustText = trustSection.textContent || '';
    const workflowItems = Array.from(
      trustSection.querySelectorAll<HTMLElement>('[data-testid="trust-proof-item"]'),
      (item) => item.textContent?.trim(),
    );
    const comesBefore = (left: HTMLElement, right: HTMLElement) =>
      Boolean(left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING);

    expect(trustSection).toBeTruthy();
    expect(focusSection).toBeTruthy();
    expect(focusSection.textContent || '').toContain('Choose your focus');
    expect(focusSection.querySelector('a[href="/machine-coding"]')).toBeTruthy();
    expect(focusSection.querySelector('a[href="/system-design"]')).toBeTruthy();
    expect(trustSection.querySelector('a')).toBeNull();
    expect(proofRow.textContent).toContain('Official-source checks');
    expect(trustText).toContain('Built for credible practice');
    expect(trustText).toContain('Frontend interview practice that shows its work.');
    expect(trustText).toContain(
      'Hands-on coding, runnable examples, regression tests, and transparent editorial updates—inside one focused workflow.',
    );
    expect(trustSection.querySelector('[data-testid="trust-milestone-value"]')?.textContent?.trim()).toBe('100');
    expect(trustText).toContain('FrontendAtlas accounts created');
    expect(trustText).toContain('Early milestone · July 2026');
    expect(trustText).toContain('FrontendAtlas Editorial');
    expect(trustText).toContain('Built and maintained as an independent frontend interview-prep project');
    expect(workflowItems).toEqual([...PUBLIC_EDITORIAL_FACTS.workflow]);
    for (const prohibited of [
      'trusted by 100 developers',
      '100 active learners',
      'loved by developers',
      'helping 100 developers land jobs',
      'a community of 100 developers',
      'and counting',
      'inflated user counts',
      'invented customer logos',
      'anonymous praise',
      'senior frontend engineer',
      'interviewer-side experience',
    ]) {
      expect(trustText.toLowerCase()).not.toContain(prohibited.toLowerCase());
    }
    expect(comesBefore(heroTitle, demoTitle)).toBeTrue();
    expect(comesBefore(demoTitle, roadmap)).toBeTrue();
    expect(comesBefore(roadmap, focusSection)).toBeTrue();
    expect(comesBefore(focusSection, trustSection)).toBeTrue();
  });

  it('renders Foundations homepage totals from the canonical unique track refs', () => {
    const page = fixture.nativeElement as HTMLElement;
    const foundationsCard = Array.from(page.querySelectorAll<HTMLElement>('.track-card'))
      .find((card) => (card.textContent || '').includes('Foundations Track (30 days)'));
    const text = foundationsCard?.textContent || '';

    expect(foundationsCard).toBeTruthy();
    expect(text).toContain('113 unique prompts');
    expect(text).toContain('5 frontend system design scenarios');
    expect(text).not.toContain('113-question progression');
  });

  it('renders the recommended preparation roadmap with the intended first route and links', () => {
    const page: HTMLElement = fixture.nativeElement;
    const roadmap = page.querySelector('[data-testid="prep-roadmap"]') as HTMLElement;
    const firstItem = page.querySelector('[data-testid="prep-roadmap-item-1"]') as HTMLAnchorElement;
    const secondItem = page.querySelector('[data-testid="prep-roadmap-item-2"]') as HTMLAnchorElement;
    const thirdItem = page.querySelector('[data-testid="prep-roadmap-item-3"]') as HTMLAnchorElement;
    const fourthItem = page.querySelector('[data-testid="prep-roadmap-item-4"]') as HTMLAnchorElement;

    expect(roadmap).toBeTruthy();
    expect(page.querySelectorAll('[data-testid^="prep-roadmap-item-"]').length).toBe(5);
    expect(roadmap.textContent || '').not.toContain('Try one real challenge');
    expect(firstItem.textContent).toContain('30-day guided study plan');
    expect(firstItem.textContent).toContain('Recommended start');
    expect(firstItem.getAttribute('href') || '').toContain('/tracks/foundations-30d/preview');
    expect(secondItem.textContent).toContain('FrontendAtlas Essential 60');
    expect(secondItem.getAttribute('href') || '').toContain('/interview-questions/essential');
    expect(thirdItem.textContent).toContain('Frontend machine coding questions');
    expect(thirdItem.getAttribute('href') || '').toContain('/machine-coding');
    expect(fourthItem.textContent).toContain('Question Library');
    expect(fourthItem.getAttribute('href') || '').toBe('/coding');
    const fifthItem = page.querySelector('[data-testid="prep-roadmap-item-5"]') as HTMLAnchorElement;
    expect(fifthItem.textContent).toContain('Final-round coverage');
    expect(fifthItem.getAttribute('href') || '').toBe('/system-design');
  });
});
