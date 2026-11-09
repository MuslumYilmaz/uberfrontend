import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ShowcasePracticeCardComponent } from './showcase-practice-card.component';

describe('ShowcasePracticeCardComponent', () => {
  let fixture: ComponentFixture<ShowcasePracticeCardComponent>;
  let component: ShowcasePracticeCardComponent;
  let host: HTMLElement;
  let analytics: jasmine.SpyObj<AnalyticsService>;

  beforeEach(() => {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    TestBed.configureTestingModule({
      imports: [ShowcasePracticeCardComponent],
      providers: [provideRouter([]), { provide: AnalyticsService, useValue: analytics }],
    });
    spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(ShowcasePracticeCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  afterEach(() => fixture.destroy());

  const byTestId = <T extends HTMLElement>(id: string) => host.querySelector<T>(`[data-testid="${id}"]`) as T;
  /** Clicks a link without leaving the test page; the router is a spy. */
  const follow = (link: HTMLElement) => {
    link.addEventListener('click', (event) => event.preventDefault());
    link.click();
    fixture.detectChanges();
  };

  it('starts practice on the topic the sentence shows', () => {
    const start = byTestId<HTMLAnchorElement>('showcase-practice-start');
    expect(start.getAttribute('href')).toBe('/coding?tech=javascript');
    expect(byTestId('showcase-practice-slot').getAttribute('aria-label')).toBe('Choose what to prepare for. Now: JavaScript');

    component.index.set(4);
    fixture.detectChanges();
    expect(start.getAttribute('href')).toBe('/system-design');
    expect(byTestId('showcase-practice-slot').getAttribute('aria-label')).toBe('Choose what to prepare for. Now: System design');

    follow(start);
    expect(analytics.track).toHaveBeenCalledOnceWith('lp_primary_cta_clicked', { src: 'lp_hero', surface: 'practice_card', route: '/system-design' });
  });

  it('lists every topic, each straight to its practice page, and closes on Escape with focus back on the sentence', () => {
    const slot = byTestId<HTMLButtonElement>('showcase-practice-slot');
    expect(byTestId('showcase-practice-menu')).toBeNull();
    slot.click();
    fixture.detectChanges();
    expect(slot.getAttribute('aria-expanded')).toBe('true');

    const options = Array.from(byTestId('showcase-practice-menu').querySelectorAll<HTMLAnchorElement>('a'));
    expect(options.map((option) => [option.querySelector('.practice-option__name')?.textContent, option.getAttribute('href')])).toEqual([
      ['JavaScript', '/coding?tech=javascript'],
      ['React', '/coding?tech=react'],
      ['Angular', '/coding?tech=angular'],
      ['Vue', '/coding?tech=vue'],
      ['System design', '/system-design'],
      ['Tradeoffs', '/tradeoffs'],
      ['Incidents', '/incidents'],
    ]);

    slot.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(byTestId('showcase-practice-menu')).toBeNull();
    expect(document.activeElement).toBe(slot);
  });

  it('counts a pick from the list and closes it, and closes on a click elsewhere', () => {
    byTestId('showcase-practice-slot').click();
    fixture.detectChanges();
    follow(byTestId('showcase-practice-menu').querySelectorAll<HTMLAnchorElement>('a')[1]);
    expect(analytics.track).toHaveBeenCalledOnceWith('lp_primary_cta_clicked', { src: 'lp_hero', surface: 'topic_menu', route: '/coding?tech=react' });
    expect(component.open()).toBeFalse();

    byTestId('showcase-practice-slot').click();
    fixture.detectChanges();
    document.body.click();
    fixture.detectChanges();
    expect(component.open()).toBeFalse();
  });

  it('holds the sentence while the card is pointed at, focused or open', () => {
    expect(component.paused()).toBeFalse();
    component.hovering.set(true);
    expect(component.paused()).toBeTrue();
    component.hovering.set(false);
    component.focused.set(true);
    expect(component.paused()).toBeTrue();
    component.focused.set(false);
    component.open.set(true);
    expect(component.paused()).toBeTrue();
  });

  it('keeps the 30-day plan as the quieter way to start', () => {
    const plan = byTestId<HTMLAnchorElement>('showcase-practice-plan');
    expect(plan.textContent?.trim()).toBe('Not sure? Follow the 30-day plan');
    expect(plan.getAttribute('href')).toBe('/tracks/foundations-30d/preview');
    follow(plan);
    expect(analytics.track).toHaveBeenCalledOnceWith('lp_secondary_cta_clicked', {
      src: 'lp_hero',
      destination: 'foundations_30d_preview',
      route: '/tracks/foundations-30d/preview',
    });
  });
});
