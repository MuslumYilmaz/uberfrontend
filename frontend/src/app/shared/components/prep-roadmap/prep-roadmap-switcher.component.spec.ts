import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { PrepRoadmapSwitcherComponent } from './prep-roadmap-switcher.component';

@Component({
  standalone: true,
  template: '',
})
class DummyRouteComponent {}

describe('PrepRoadmapSwitcherComponent', () => {
  async function createAt(url: string): Promise<ComponentFixture<PrepRoadmapSwitcherComponent>> {
    const fixture = TestBed.createComponent(PrepRoadmapSwitcherComponent);
    const router = TestBed.inject(Router);
    await fixture.ngZone!.run(() => router.navigateByUrl(url));
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PrepRoadmapSwitcherComponent,
        RouterTestingModule.withRoutes([
          { path: 'guides/interview-blueprint/intro', component: DummyRouteComponent },
          { path: 'interview-questions/essential', component: DummyRouteComponent },
          { path: 'coding', component: DummyRouteComponent },
          { path: 'react/coding', component: DummyRouteComponent },
          { path: 'react/coding/:id', component: DummyRouteComponent },
          { path: 'tracks', component: DummyRouteComponent },
          { path: 'system-design', component: DummyRouteComponent },
          { path: 'dashboard', component: DummyRouteComponent },
        ]),
      ],
    }).compileComponents();
  });

  it('shows the current step and remaining step count on prep routes', async () => {
    const fixture = await createAt('/interview-questions/essential');
    const host = fixture.nativeElement as HTMLElement;
    const switcher = host.querySelector('[data-testid="prep-roadmap-switcher"]') as HTMLElement;

    expect(switcher).toBeTruthy();
    expect(switcher.textContent || '').toContain('Recommended preparation');
    expect(switcher.textContent || '').toContain('FrontendAtlas Essential 60');
    expect(switcher.textContent || '').toContain('4 other steps');
  });

  it('opens the dropdown with all steps, active state, and inactive links', async () => {
    const fixture = await createAt('/interview-questions/essential');
    const host = fixture.nativeElement as HTMLElement;
    const trigger = host.querySelector('[data-testid="prep-roadmap-switcher-trigger"]') as HTMLButtonElement;

    trigger.click();
    fixture.detectChanges();

    const panel = host.querySelector('[data-testid="prep-roadmap-switcher-panel"]') as HTMLElement;
    const items = Array.from(host.querySelectorAll('[data-testid^="prep-roadmap-switcher-item-"]')) as HTMLAnchorElement[];
    const active = host.querySelector('[aria-current="page"]') as HTMLAnchorElement;
    const guide = host.querySelector('[data-testid="prep-roadmap-switcher-item-1"]') as HTMLAnchorElement;
    const library = host.querySelector('[data-testid="prep-roadmap-switcher-item-3"]') as HTMLAnchorElement;
    const finalRounds = host.querySelector('[data-testid="prep-roadmap-switcher-item-5"]') as HTMLAnchorElement;

    expect(panel).toBeTruthy();
    expect(items.length).toBe(5);
    expect(active.getAttribute('data-testid')).toBe('prep-roadmap-switcher-item-2');
    expect(active.textContent || '').toContain('FrontendAtlas Essential 60');
    expect(guide.getAttribute('href') || '').toContain('/guides/interview-blueprint/intro');
    expect(library.getAttribute('href') || '').toContain('/coding?reset=1');
    expect(finalRounds.getAttribute('href') || '').toContain('/coding?view=formats&category=system');
  });

  it('treats the system formats coding view as final-round coverage', async () => {
    const fixture = await createAt('/coding?view=formats&category=system');
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="prep-roadmap-switcher"]')).toBeTruthy();
    expect(host.textContent || '').toContain('Add final-round coverage');
  });

  it('closes the dropdown on outside click, link click, and route change', async () => {
    const fixture = await createAt('/interview-questions/essential');
    const router = TestBed.inject(Router);
    const host = fixture.nativeElement as HTMLElement;
    const trigger = host.querySelector('[data-testid="prep-roadmap-switcher-trigger"]') as HTMLButtonElement;

    trigger.click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="prep-roadmap-switcher-panel"]')).toBeTruthy();

    document.body.click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="prep-roadmap-switcher-panel"]')).toBeNull();

    trigger.click();
    fixture.detectChanges();
    const guide = host.querySelector('[data-testid="prep-roadmap-switcher-item-1"]') as HTMLAnchorElement;
    fixture.ngZone!.run(() => guide.click());
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="prep-roadmap-switcher-panel"]')).toBeNull();

    await fixture.ngZone!.run(() => router.navigateByUrl('/interview-questions/essential'));
    fixture.detectChanges();
    (host.querySelector('[data-testid="prep-roadmap-switcher-trigger"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="prep-roadmap-switcher-panel"]')).toBeTruthy();

    await fixture.ngZone!.run(() => router.navigateByUrl('/coding'));
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="prep-roadmap-switcher-panel"]')).toBeNull();
    expect(host.textContent || '').toContain('Broaden with Question Library');
  });

  it('matches question-library list routes but hides on individual coding detail pages', async () => {
    const fixture = await createAt('/react/coding');
    const router = TestBed.inject(Router);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="prep-roadmap-switcher"]')).toBeTruthy();
    expect(host.textContent || '').toContain('Broaden with Question Library');

    await fixture.ngZone!.run(() => router.navigateByUrl('/react/coding/react-counter'));
    fixture.detectChanges();

    expect(host.querySelector('[data-testid="prep-roadmap-switcher"]')).toBeNull();
  });

  it('hides on non-prep routes', async () => {
    const fixture = await createAt('/dashboard');
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="prep-roadmap-switcher"]')).toBeNull();
  });
});
