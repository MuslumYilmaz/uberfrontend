import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConversionStickyCtaComponent } from './conversion-sticky-cta.component';

describe('ConversionStickyCtaComponent', () => {
  let fixture: ComponentFixture<ConversionStickyCtaComponent>;
  let authUiState: ReturnType<typeof signal<'signed_out' | 'authenticated' | 'pending'>>;
  let user: ReturnType<typeof signal<any>>;

  beforeEach(async () => {
    sessionStorage.removeItem('fa:conversion-sticky:dismissed:v1');
    authUiState = signal<'signed_out' | 'authenticated' | 'pending'>('signed_out');
    user = signal<any>(null);
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(390);

    // This component intentionally observes page-level landmarks. Isolate
    // those lookups so DOM left by unrelated full-suite fixtures cannot make
    // this unit test think a pricing grid or overlay is currently visible.
    const querySelector = document.querySelector.bind(document);
    spyOn(document, 'querySelector').and.callFake((selector: string) => {
      if (
        selector === '.showcase-hero'
        || selector === '#pricing-plans'
        || selector === '.famh-mobile-panel, .p-dialog-mask'
      ) {
        return null;
      }
      return querySelector(selector);
    });

    await TestBed.configureTestingModule({
      imports: [ConversionStickyCtaComponent],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: jasmine.createSpyObj('AnalyticsService', ['track']) },
        {
          provide: AuthService,
          useValue: { authUiState, user },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConversionStickyCtaComponent);
    fixture.componentRef.setInput('surface', 'pricing');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
    sessionStorage.removeItem('fa:conversion-sticky:dismissed:v1');
  });

  it('shows clean account and pricing links for signed-out mobile visitors', () => {
    const aside = fixture.nativeElement.querySelector('aside') as HTMLElement;
    const dismiss = fixture.nativeElement.querySelector('.conversion-sticky__dismiss') as HTMLButtonElement;
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];

    expect(aside.getAttribute('aria-label')).toBe('Account and pricing shortcuts');
    expect(aside.hasAttribute('aria-live')).toBeFalse();
    expect(dismiss.getAttribute('aria-label')).toBe('Hide shortcuts for this session');
    expect(links.map((link) => (link.textContent || '').trim())).toEqual([
      'Create free account',
      'Compare plans',
    ]);
    expect(links[1].getAttribute('href')).toBe('/pricing#pricing-plans');
  });

  it('shows only pricing for free accounts and hides entirely for Premium', () => {
    authUiState.set('authenticated');
    user.set({ accessTier: 'free' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('View pricing');
    expect(fixture.nativeElement.textContent).not.toContain('Create free account');

    user.set({ accessTier: 'premium', effectiveProActive: true });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="conversion-mobile-sticky"]')).toBeNull();
  });

  it('keeps a dismissal for the rest of the browser session', () => {
    const dismiss = fixture.nativeElement.querySelector('.conversion-sticky__dismiss') as HTMLButtonElement;
    dismiss.click();
    fixture.detectChanges();

    expect(sessionStorage.getItem('fa:conversion-sticky:dismissed:v1')).toBe('1');
    expect(fixture.nativeElement.querySelector('[data-testid="conversion-mobile-sticky"]')).toBeNull();
  });
});
