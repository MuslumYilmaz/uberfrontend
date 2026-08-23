import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Tooltip } from 'primeng/tooltip';
import { BugReportService } from '../../core/services/bug-report.service';
import { PracticeRegistryService } from '../../core/services/practice-registry.service';
import { AppSidebarDrawerService } from '../../core/services/app-sidebar-drawer.service';
import { AuthService } from '../../core/services/auth.service';
import { InterviewAccessMode } from '../../core/models/interview.model';
import { InterviewService } from '../../core/services/interview.service';
import { AppSidebarComponent } from './app-sidebar.component';

@Component({
  standalone: true,
  template: '',
})
class DummyPageComponent {}

describe('AppSidebarComponent', () => {
  async function configureTestingModule(options?: {
    isLoggedIn?: boolean;
    isPro?: boolean;
    role?: 'user' | 'admin';
    interviewAccessMode?: InterviewAccessMode;
    interviewEnabled?: boolean;
    authUiState?: 'pending' | 'authenticated' | 'signed_out';
  }) {
    const isLoggedIn = options?.isLoggedIn ?? false;
    const isPro = options?.isPro ?? false;
    const role = options?.role ?? 'user';
    const interviewAccessMode = options?.interviewAccessMode ?? 'off';
    const interviewEnabled = options?.interviewEnabled
      ?? interviewAccessMode !== 'off';
    const authUiState = signal(options?.authUiState ?? (isLoggedIn ? 'authenticated' : 'signed_out'));
    const bugReport = jasmine.createSpyObj<BugReportService>('BugReportService', ['open']);
    const interviews = jasmine.createSpyObj<InterviewService>('InterviewService', [
      'getAvailability',
    ]);
    interviews.getAvailability.and.returnValue(of({
      enabled: interviewEnabled,
      accessMode: interviewAccessMode,
      unavailableReason: interviewEnabled ? null : 'Interview Mode is unavailable.',
      quota: null,
      quotas: { coding: null, 'system-design': null },
      activeSession: null,
      lastResults: [],
      targets: [],
      formats: [],
      formatAvailability: [],
      levels: [],
      tracks: [],
      minViewportWidth: 768,
      timing: {
        mcqSeconds: 600,
        codingReadySeconds: 300,
        systemDesignSeconds: { junior: 600, mid: 900, senior: 1200 },
      },
    }));
    const practiceRegistry = {
      catalogEntries: signal([
        { key: 'question-library', label: 'Question Library', icon: 'pi pi-database', route: '/coding', family: 'question' },
        { key: 'incidents', label: 'Debug scenarios', icon: 'pi pi-bolt', route: '/incidents', family: 'incident', badge: 'New' },
        {
          key: 'system-design',
          label: 'System Design',
          icon: 'pi pi-sitemap',
          route: '/system-design',
          family: 'question',
        },
        { key: 'tradeoff-battles', label: 'Tradeoff battles', icon: 'pi pi-directions-alt', route: '/tradeoffs', family: 'tradeoff-battle', badge: 'New' },
        { key: 'tracks', label: 'Interview prep tracks', icon: 'pi pi-directions', route: '/tracks', isSupplemental: true },
        {
          key: 'question-formats',
          label: 'Practice Types',
          icon: 'pi pi-clone',
          route: '/coding',
          query: { view: 'formats' },
          isSupplemental: true,
        },
      ]),
    };

    await TestBed.configureTestingModule({
      imports: [
        AppSidebarComponent,
        DummyPageComponent,
        RouterTestingModule.withRoutes([
          { path: 'dashboard', component: DummyPageComponent },
          { path: 'interview', component: DummyPageComponent },
          { path: 'interview/:id', component: DummyPageComponent },
          { path: 'coding', component: DummyPageComponent },
          { path: 'coding/:id', component: DummyPageComponent },
          { path: ':tech/coding/:id', component: DummyPageComponent },
          { path: ':tech/trivia/:id', component: DummyPageComponent },
          { path: ':tech/debug/:id', component: DummyPageComponent },
          { path: 'incidents', component: DummyPageComponent },
          { path: 'incidents/:id', component: DummyPageComponent },
          { path: 'tradeoffs', component: DummyPageComponent },
          { path: 'tradeoffs/:id', component: DummyPageComponent },
          { path: 'system-design', component: DummyPageComponent },
          { path: 'system-design/:slug', component: DummyPageComponent },
          { path: 'tracks', component: DummyPageComponent },
          { path: 'tracks/crash-7d', component: DummyPageComponent },
          { path: 'tracks/foundations-30d', component: DummyPageComponent },
          { path: 'focus-areas', component: DummyPageComponent },
          { path: 'companies', component: DummyPageComponent },
          { path: 'companies/:slug', component: DummyPageComponent },
          { path: 'guides/interview-blueprint', component: DummyPageComponent },
          { path: 'guides/interview-blueprint/:slug', component: DummyPageComponent },
          { path: 'guides/framework-prep', component: DummyPageComponent },
          { path: 'guides/framework-prep/:slug', component: DummyPageComponent },
          { path: 'guides/behavioral', component: DummyPageComponent },
          { path: 'guides/behavioral/:slug', component: DummyPageComponent },
          { path: 'guides/system-design-blueprint', component: DummyPageComponent },
          { path: 'guides/system-design-blueprint/:slug', component: DummyPageComponent },
          { path: 'tools/cv', component: DummyPageComponent },
          { path: 'tools/cv-linter', component: DummyPageComponent },
          { path: 'changelog', component: DummyPageComponent },
        ]),
      ],
      providers: [
        { provide: BugReportService, useValue: bugReport },
        { provide: PracticeRegistryService, useValue: practiceRegistry },
        { provide: InterviewService, useValue: interviews },
        {
          provide: AuthService,
          useValue: {
            user: signal(
              isLoggedIn
                ? {
                  _id: 'user_1',
                  username: 'sidebar_user',
                  email: 'sidebar@example.com',
                  role,
                  accessTier: isPro ? 'premium' : 'free',
                }
                : null,
            ),
            isLoggedIn: signal(isLoggedIn),
            authUiState,
          },
        },
      ],
    }).compileComponents();

    return {
      bugReport,
      interviews,
      router: TestBed.inject(Router),
      authUiState,
    };
  }

  it('opens bug report flow from sidebar action', async () => {
    const { bugReport } = await configureTestingModule();

    const fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button[aria-label="Report a bug"]') as HTMLButtonElement;
    expect(button).toBeTruthy();

    button.click();

    expect(bugReport.open).toHaveBeenCalled();
    expect(bugReport.open).toHaveBeenCalledWith(jasmine.objectContaining({
      source: 'sidebar',
      route: '/',
    }));
  });

  it('names compact rail controls and only enables their tooltips while collapsed', async () => {
    await configureTestingModule();
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    const fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.componentInstance.collapsed = true;
    fixture.detectChanges();

    const homeDebug = fixture.debugElement.query(By.css('a[aria-label="Home base"]'));
    const practiceButton = fixture.nativeElement.querySelector(
      'button[aria-label="Practice Library"]',
    ) as HTMLButtonElement;
    expect(homeDebug).toBeTruthy();
    expect(homeDebug.injector.get(Tooltip).disabled).toBeFalse();
    expect(practiceButton.getAttribute('aria-expanded')).toBe('false');

    fixture.componentInstance.collapsed = false;
    fixture.detectChanges();
    expect(homeDebug.injector.get(Tooltip).disabled).toBeTrue();
  });

  it('keeps collapsed or closed group links hidden and inert until their group is visibly expanded', async () => {
    await configureTestingModule();
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    const fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.componentInstance.collapsed = true;
    fixture.detectChanges();
    (fixture.componentInstance.nav[1] as any).open = true;
    fixture.detectChanges();

    const practiceButton = fixture.nativeElement.querySelector(
      'button[aria-label="Practice Library"]',
    ) as HTMLButtonElement;
    const group = fixture.nativeElement.querySelector('#group-1') as HTMLElement;
    const hiddenLink = group.querySelector('a') as HTMLAnchorElement;

    expect(practiceButton.getAttribute('aria-expanded')).toBe('false');
    expect(group.getAttribute('aria-hidden')).toBe('true');
    expect(group.hasAttribute('inert')).toBeTrue();
    hiddenLink.focus();
    expect(document.activeElement).not.toBe(hiddenLink);

    fixture.componentInstance.collapsed = false;
    fixture.detectChanges();
    expect(practiceButton.getAttribute('aria-expanded')).toBe('true');
    expect(group.hasAttribute('aria-hidden')).toBeFalse();
    expect(group.hasAttribute('inert')).toBeFalse();

    practiceButton.click();
    fixture.detectChanges();
    expect(practiceButton.getAttribute('aria-expanded')).toBe('false');
    expect(group.getAttribute('aria-hidden')).toBe('true');
    expect(group.hasAttribute('inert')).toBeTrue();
  });

  it('highlights debug scenarios and opens the practice catalog for incident detail routes', async () => {
    const { router } = await configureTestingModule();
    const fixture = TestBed.createComponent(AppSidebarComponent);

    await fixture.ngZone?.run(async () => router.navigateByUrl('/incidents/context-rerender-storm'));
    await fixture.whenStable();
    fixture.detectChanges();

    const incidentsLink = fixture.nativeElement.querySelector('a[aria-label="Debug scenarios"]') as HTMLAnchorElement;
    const practiceCatalog = fixture.nativeElement.querySelector('#group-1') as HTMLElement;

    expect(incidentsLink.classList.contains('is-active')).toBeTrue();
    expect(practiceCatalog.classList.contains('open')).toBeTrue();
  });

  it('highlights tradeoff battles for tradeoff detail routes', async () => {
    const { router } = await configureTestingModule();
    const fixture = TestBed.createComponent(AppSidebarComponent);

    await fixture.ngZone?.run(async () => router.navigateByUrl('/tradeoffs/context-vs-zustand-vs-redux'));
    await fixture.whenStable();
    fixture.detectChanges();

    const tradeoffLink = fixture.nativeElement.querySelector('a[aria-label="Tradeoff battles"]') as HTMLAnchorElement;
    const practiceCatalog = fixture.nativeElement.querySelector('#group-1') as HTMLElement;

    expect(tradeoffLink.classList.contains('is-active')).toBeTrue();
    expect(practiceCatalog.classList.contains('open')).toBeTrue();
  });

  it('renders updated badges for debug scenarios and tradeoff battles in the practice catalog', async () => {
    await configureTestingModule();
    const fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();

    const badges = Array
      .from(fixture.nativeElement.querySelectorAll('.nav-badge') as NodeListOf<HTMLElement>)
      .map((node) => node.textContent?.trim());
    expect(badges).toContain('New');

    const incidentsLink = fixture.nativeElement.querySelector('a[aria-label="Debug scenarios"]') as HTMLAnchorElement;
    const tradeoffLink = fixture.nativeElement.querySelector('a[aria-label="Tradeoff battles"]') as HTMLAnchorElement;
    expect(incidentsLink.textContent || '').toContain('New');
    expect(tradeoffLink.textContent || '').toContain('New');
  });

  it('marks system design active for coding format routes with the system category', async () => {
    const { router } = await configureTestingModule();
    const fixture = TestBed.createComponent(AppSidebarComponent);

    await fixture.ngZone?.run(async () => router.navigateByUrl('/coding?view=formats&category=system'));
    await fixture.whenStable();
    fixture.detectChanges();

    const systemDesignLink = fixture.nativeElement.querySelector('a[aria-label="System Design"]') as HTMLAnchorElement;
    const questionLibraryLink = fixture.nativeElement.querySelector('a[aria-label="Question Library"]') as HTMLAnchorElement;

    expect(systemDesignLink.classList.contains('is-active')).toBeTrue();
    expect(questionLibraryLink.classList.contains('is-active')).toBeFalse();
  });

  it('marks question library active for question detail routes', async () => {
    const { router } = await configureTestingModule();
    const fixture = TestBed.createComponent(AppSidebarComponent);

    await fixture.ngZone?.run(async () => router.navigateByUrl('/react/coding/react-counter'));
    await fixture.whenStable();
    fixture.detectChanges();

    const questionLibraryLink = fixture.nativeElement.querySelector('a[aria-label="Question Library"]') as HTMLAnchorElement;
    const practiceCatalog = fixture.nativeElement.querySelector('#group-1') as HTMLElement;

    expect(questionLibraryLink.classList.contains('is-active')).toBeTrue();
    expect(practiceCatalog.classList.contains('open')).toBeTrue();
  });

  it('exposes the timed mock interview and keeps it active during a session', async () => {
    const { router } = await configureTestingModule({
      isLoggedIn: true,
      interviewAccessMode: 'public',
    });
    const fixture = TestBed.createComponent(AppSidebarComponent);

    await fixture.ngZone?.run(async () => router.navigateByUrl('/interview/session-1'));
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const interviewLink = fixture.nativeElement.querySelector(
      'a[aria-label="Timed Mock Interview"]',
    ) as HTMLAnchorElement;
    const practiceCatalog = fixture.nativeElement.querySelector('#group-1') as HTMLElement;

    expect(interviewLink).toBeTruthy();
    expect(interviewLink.getAttribute('href') || '').toContain('/interview');
    expect(interviewLink.classList.contains('is-active')).toBeTrue();
    expect(practiceCatalog.classList.contains('open')).toBeTrue();
  });

  it('does not expose the interview link while the feature is off', async () => {
    await configureTestingModule({
      isLoggedIn: true,
      interviewAccessMode: 'off',
      interviewEnabled: false,
    });
    const fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('a[aria-label="Timed Mock Interview"]'),
    ).toBeNull();
  });

  it('hides internal preview navigation from non-admin users', async () => {
    await configureTestingModule({
      isLoggedIn: true,
      role: 'user',
      interviewAccessMode: 'internal',
      interviewEnabled: true,
    });
    const fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('a[aria-label="Timed Mock Interview"]'),
    ).toBeNull();
  });

  it('does not expose admin routes in the normal-user sidebar or mobile drawer', async () => {
    await configureTestingModule({
      isLoggedIn: true,
      role: 'user',
    });
    const fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();

    const adminLinks = Array
      .from(fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>)
      .filter((link) => (link.getAttribute('href') || '').startsWith('/admin'));
    expect(adminLinks).toEqual([]);
  });

  it('exposes internal preview navigation to admins', async () => {
    await configureTestingModule({
      isLoggedIn: true,
      role: 'admin',
      interviewAccessMode: 'internal',
      interviewEnabled: true,
    });
    const fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('a[aria-label="Timed Mock Interview"]'),
    ).not.toBeNull();
  });

  it('opens the drawer when the shared drawer service is toggled', async () => {
    await configureTestingModule();
    const drawer = TestBed.inject(AppSidebarDrawerService);
    const fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();

    drawer.open();
    fixture.detectChanges();

    const sidebar = fixture.nativeElement.querySelector('#app-sidebar-drawer') as HTMLElement;
    expect(sidebar.classList.contains('is-open')).toBeTrue();
  });

  it('renders guest auth actions and prep shortcut in the mobile drawer footer', async () => {
    await configureTestingModule();
    const fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="sidebar-mobile-signup"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="sidebar-mobile-login"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="sidebar-mobile-pricing"]')).toBeFalsy();

    const prepLink = fixture.nativeElement.querySelector('[data-testid="sidebar-mobile-start-prep"]') as HTMLAnchorElement;
    expect(prepLink).toBeTruthy();
    expect(prepLink.textContent || '').toContain('Start prep');
    expect(prepLink.getAttribute('href') || '').toContain('/guides/interview-blueprint/intro');
  });

  it('keeps all drawer account actions hidden while auth is pending', async () => {
    await configureTestingModule({ isLoggedIn: true, authUiState: 'pending' });
    const fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();

    const pending = fixture.nativeElement.querySelector('[data-testid="sidebar-mobile-auth-pending"]') as HTMLElement;
    const actions = fixture.nativeElement.querySelector('.mobile-auth-actions') as HTMLElement;

    expect(pending).toBeTruthy();
    expect(pending.getAttribute('aria-hidden')).toBe('true');
    expect(actions.getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.querySelector('[data-testid="sidebar-mobile-profile"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="sidebar-mobile-pricing"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="sidebar-mobile-signup"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="sidebar-mobile-login"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="sidebar-mobile-start-prep"]')).toBeFalsy();
  });

  it('reactively replaces the drawer placeholder with authenticated account actions', async () => {
    const { authUiState } = await configureTestingModule({ isLoggedIn: true, authUiState: 'pending' });
    const fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();

    authUiState.set('authenticated');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="sidebar-mobile-auth-pending"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="sidebar-mobile-profile"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="sidebar-mobile-pricing"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="sidebar-mobile-login"]')).toBeFalsy();
  });

  it('renders framework prep links in the Guides group', async () => {
    await configureTestingModule();
    const fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();

    const guideLabels = Array
      .from(fixture.nativeElement.querySelectorAll('#group-3 a') as NodeListOf<HTMLAnchorElement>)
      .map((link) => ({
        label: (link.textContent || '').replace(/\s+/g, ' ').trim(),
        href: link.getAttribute('href') || '',
      }));

    expect(guideLabels).toEqual(jasmine.arrayContaining([
      jasmine.objectContaining({ label: 'Interview Playbook Hub', href: '/guides/interview-blueprint' }),
      jasmine.objectContaining({ label: 'Framework Prep Guide', href: '/guides/framework-prep' }),
      jasmine.objectContaining({ label: 'JavaScript prep path', href: '/guides/framework-prep/javascript-prep-path' }),
      jasmine.objectContaining({ label: 'React prep path', href: '/guides/framework-prep/react-prep-path' }),
      jasmine.objectContaining({ label: 'Angular prep path', href: '/guides/framework-prep/angular-prep-path' }),
      jasmine.objectContaining({ label: 'Vue prep path', href: '/guides/framework-prep/vue-prep-path' }),
      jasmine.objectContaining({ label: 'System Design Blueprint', href: '/guides/system-design-blueprint' }),
      jasmine.objectContaining({ label: 'Behavioral Prep', href: '/guides/behavioral' }),
    ]));
  });

  it('keeps the mobile pricing shortcut for signed-in free users', async () => {
    await configureTestingModule({ isLoggedIn: true });
    const fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();

    const pricingLink = fixture.nativeElement.querySelector('[data-testid="sidebar-mobile-pricing"]') as HTMLAnchorElement;
    expect(pricingLink).toBeTruthy();
    expect(pricingLink.textContent || '').toContain('Upgrade');
    expect(pricingLink.getAttribute('href') || '').toContain('/pricing');
  });

  it('renders a profile shortcut for signed-in users in the mobile drawer footer', async () => {
    await configureTestingModule({ isLoggedIn: true });
    const fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();

    const profileLink = fixture.nativeElement.querySelector('[data-testid="sidebar-mobile-profile"]') as HTMLAnchorElement;
    expect(profileLink).toBeTruthy();
    expect(profileLink.getAttribute('href') || '').toContain('/profile');
  });

  it('hides the pricing shortcut for premium users in the mobile drawer footer', async () => {
    await configureTestingModule({ isLoggedIn: true, isPro: true });
    const fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="sidebar-mobile-pricing"]')).toBeFalsy();
  });
});
