import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BugReportService } from '../../core/services/bug-report.service';
import { PracticeRegistryService } from '../../core/services/practice-registry.service';
import { AppSidebarComponent } from './app-sidebar.component';

@Component({
  standalone: true,
  template: '',
})
class DummyPageComponent {}

describe('AppSidebarComponent', () => {
  async function configureTestingModule() {
    const bugReport = jasmine.createSpyObj<BugReportService>('BugReportService', ['open']);
    const practiceRegistry = {
      catalogEntries: signal([
        { key: 'question-library', label: 'Question library', icon: 'pi pi-database', route: '/coding', family: 'question' },
        { key: 'incidents', label: 'Debug scenarios', icon: 'pi pi-bolt', route: '/incidents', family: 'incident' },
        {
          key: 'system-design',
          label: 'System design',
          icon: 'pi pi-sitemap',
          route: '/coding',
          query: { view: 'formats', category: 'system' },
          family: 'question',
        },
        { key: 'tradeoff-battles', label: 'Tradeoff battles', icon: 'pi pi-directions-alt', route: '/tradeoffs', family: 'tradeoff-battle' },
        { key: 'tracks', label: 'Interview prep tracks', icon: 'pi pi-directions', route: '/tracks', isSupplemental: true },
        {
          key: 'question-formats',
          label: 'Question formats',
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
      ],
    }).compileComponents();

    return {
      bugReport,
      router: TestBed.inject(Router),
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

  it('marks system design active for coding format routes with the system category', async () => {
    const { router } = await configureTestingModule();
    const fixture = TestBed.createComponent(AppSidebarComponent);

    await fixture.ngZone?.run(async () => router.navigateByUrl('/coding?view=formats&category=system'));
    await fixture.whenStable();
    fixture.detectChanges();

    const systemDesignLink = fixture.nativeElement.querySelector('a[aria-label="System design"]') as HTMLAnchorElement;
    const questionLibraryLink = fixture.nativeElement.querySelector('a[aria-label="Question library"]') as HTMLAnchorElement;

    expect(systemDesignLink.classList.contains('is-active')).toBeTrue();
    expect(questionLibraryLink.classList.contains('is-active')).toBeFalse();
  });

  it('marks question library active for question detail routes', async () => {
    const { router } = await configureTestingModule();
    const fixture = TestBed.createComponent(AppSidebarComponent);

    await fixture.ngZone?.run(async () => router.navigateByUrl('/react/coding/react-counter'));
    await fixture.whenStable();
    fixture.detectChanges();

    const questionLibraryLink = fixture.nativeElement.querySelector('a[aria-label="Question library"]') as HTMLAnchorElement;
    const practiceCatalog = fixture.nativeElement.querySelector('#group-1') as HTMLElement;

    expect(questionLibraryLink.classList.contains('is-active')).toBeTrue();
    expect(practiceCatalog.classList.contains('open')).toBeTrue();
  });
});
