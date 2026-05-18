import { DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DOCUMENT } from '@angular/common';
import { AppComponent } from './app.component';
import { BugReportService } from './core/services/bug-report.service';
import { AuthService, User } from './core/services/auth.service';

@Component({
  standalone: true,
  template: '',
})
class DummyDashboardComponent {}

function createDocumentAt(pathname: string): Document {
  const testLocation = {
    pathname,
    search: '',
    hash: '',
  };

  return new Proxy(document, {
    get(target, prop) {
      if (prop === 'location') return testLocation;

      const value = Reflect.get(target, prop, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  }) as Document;
}

describe('AppComponent', () => {
  async function renderDeferredBlocks(fixture: any): Promise<void> {
    const blocks = await fixture.getDeferBlocks();
    await Promise.all(blocks.map((block: any) => block.render(DeferBlockState.Complete)));
    fixture.detectChanges();
  }

  function mockDesktopViewport(): void {
    spyOn(window, 'matchMedia').and.callFake((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    } as MediaQueryList));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        RouterTestingModule.withRoutes([
          { path: 'dashboard', component: DummyDashboardComponent },
          { path: 'coding', component: DummyDashboardComponent },
          { path: 'tracks', component: DummyDashboardComponent },
          { path: 'interview-questions', component: DummyDashboardComponent },
          { path: 'interview-questions/essential', component: DummyDashboardComponent },
        ]),
        NoopAnimationsModule,
        HttpClientTestingModule,
      ],
      providers: [
        { provide: DOCUMENT, useValue: createDocumentAt('/') },
      ],
      deferBlockBehavior: DeferBlockBehavior.Playthrough,
    }).compileComponents();
    mockDesktopViewport();
  });

  it('does not mount bug report dialog until requested', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-bug-report-dialog')).toBeNull();

    const bugReport = TestBed.inject(BugReportService);
    bugReport.open({ source: 'spec', url: '/spec' });
    fixture.detectChanges();
    expect(bugReport.visible()).toBeTrue();
  });

  it('switches from marketing header to app header on non-marketing routes', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    let compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-marketing-header')).not.toBeNull();
    expect(compiled.querySelector('app-header')).toBeNull();

    const router = TestBed.inject(Router);
    await fixture.ngZone!.run(() => router.navigateByUrl('/dashboard'));
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-marketing-header')).toBeNull();
    expect(compiled.querySelector('app-header')).not.toBeNull();
  });

  it('keeps the compact prep switcher hidden on the homepage', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('[data-testid="prep-roadmap-switcher"]')).toBeNull();
  });

  it('shows the compact prep switcher on prep destination routes', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    await fixture.ngZone!.run(() => router.navigateByUrl('/interview-questions/essential'));
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const switcher = compiled.querySelector('[data-testid="prep-roadmap-switcher"]') as HTMLElement;

    expect(switcher).toBeTruthy();
    expect(switcher.classList.contains('prep-switcher--compact')).toBeTrue();
    expect(switcher.textContent || '').toContain('Prep path');
    expect(switcher.textContent || '').toContain('FrontendAtlas Essential 60');
    expect(switcher.textContent || '').toContain('4 other steps');
  });

  it('starts guest starter routes with a collapsed sidebar rail', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    await fixture.ngZone!.run(() => router.navigateByUrl('/coding?reset=1'));
    fixture.detectChanges();
    await renderDeferredBlocks(fixture);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.sidebar')?.classList.contains('is-collapsed')).toBeTrue();
    expect(compiled.querySelector('[data-testid="prep-roadmap-switcher"]')?.classList.contains('prep-switcher--compact')).toBeTrue();
  });

  it('does not show the prep switcher on guest dashboard without an explicit prep route', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    await fixture.ngZone!.run(() => router.navigateByUrl('/dashboard'));
    fixture.detectChanges();
    await renderDeferredBlocks(fixture);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="prep-roadmap-switcher"]')).toBeNull();
  });

  it('keeps logged-in starter routes in the regular shell density', async () => {
    const auth = TestBed.inject(AuthService);
    auth.user.set({
      _id: 'user-1',
      username: 'member',
      email: 'member@example.com',
      role: 'user',
      prefs: {
        tz: 'UTC',
        theme: 'dark',
        defaultTech: 'javascript',
        keyboard: 'default',
        marketingEmails: false,
      },
      createdAt: '2026-01-01T00:00:00.000Z',
    } as User);

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    await fixture.ngZone!.run(() => router.navigateByUrl('/coding?reset=1'));
    fixture.detectChanges();
    await renderDeferredBlocks(fixture);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.sidebar')?.classList.contains('is-collapsed')).toBeFalse();
    expect(compiled.querySelector('[data-testid="prep-roadmap-switcher"]')?.classList.contains('prep-switcher--compact')).toBeFalse();
  });
});
