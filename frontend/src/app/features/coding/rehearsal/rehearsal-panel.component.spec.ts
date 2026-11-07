import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RehearsalDefinition, RehearsalSession } from '../../../core/models/rehearsal.model';
import { RehearsalPanelComponent, formatRehearsalClock } from './rehearsal-panel.component';

const START = Date.UTC(2026, 10, 7, 12, 0, 0);
const MINUTE = 60_000;
const DEFINITION: RehearsalDefinition = {
  id: 'meta-full-loop-coding',
  company: 'meta',
  title: 'Meta coding round',
  round: 'Full loop: coding',
  summary: 'About two problems in about 40 minutes.',
  minutes: 40,
  order: 'sequential',
  items: [
    { path: '/javascript/coding/js-dom-twin-node', questionId: 'js-dom-twin-node', title: 'Find the Corresponding Node in Twin DOM Trees' },
    { path: '/javascript/coding/js-debounce', questionId: 'js-debounce', title: 'Debounce Function' },
  ],
};
const session = (patch: Partial<RehearsalSession> = {}): RehearsalSession => ({
  version: 1,
  key: `meta-full-loop-coding:${START}`,
  definition: DEFINITION,
  startedAt: START,
  endedAt: null,
  endReason: null,
  reached: 0,
  results: {},
  ...patch,
});

describe('RehearsalPanelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RehearsalPanelComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  const render = (value: RehearsalSession, phase: 'active' | 'review', questionId: string, remainingMs = 0) => {
    const fixture = TestBed.createComponent(RehearsalPanelComponent);
    fixture.componentRef.setInput('session', value);
    fixture.componentRef.setInput('phase', phase);
    fixture.componentRef.setInput('questionId', questionId);
    fixture.componentRef.setInput('remainingMs', remainingMs);
    fixture.detectChanges();
    return fixture;
  };
  // Each row's parts, read one by one as the grid lays them out.
  const items = (host: HTMLElement) =>
    Array.from(host.querySelectorAll<HTMLElement>('[data-testid="rehearsal-item"]')).map((item) =>
      Array.from(item.children).map((part) => part.textContent?.replace(/\s+/g, ' ').trim()).filter(Boolean).join(' '));

  it('keeps the second problem of a sequential rehearsal hidden until the person moves on to it', () => {
    const fixture = render(session(), 'active', 'js-dom-twin-node', 40 * MINUTE);
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[data-testid="rehearsal-clock"]')?.textContent?.trim()).toBe('40:00 left');
    // The status region exists from the start and stays quiet while the clock ticks.
    expect(host.querySelector('[data-testid="rehearsal-announcement"]')?.textContent?.trim()).toBe('');
    expect(items(host)).toEqual([
      'Problem 1 Find the Corresponding Node in Twin DOM Trees Not run yet',
      'Problem 2 Opens when you move on',
    ]);
    expect(host.querySelector('[data-testid="rehearsal-next"]')?.getAttribute('href')).toBe('/javascript/coding/js-debounce');

    let ended = false;
    fixture.componentInstance.endRehearsal.subscribe(() => (ended = true));
    (host.querySelector('[data-testid="rehearsal-end"]') as HTMLButtonElement).click();
    expect(ended).toBeTrue();
  });

  it('shows the last problem without a next step once the person reaches it', () => {
    const fixture = render(session({ reached: 1, results: { 'js-dom-twin-node': { passed: 2, total: 4, runs: 3 } } }), 'active', 'js-debounce', 12 * MINUTE);
    const host = fixture.nativeElement as HTMLElement;
    expect(items(host)).toEqual([
      'Problem 1 Find the Corresponding Node in Twin DOM Trees 2 of 4 tests pass',
      'Problem 2 Debounce Function Not run yet',
    ]);
    expect(host.querySelector('[data-testid="rehearsal-next"]')).toBeNull();
  });

  it('reviews every problem when the time is up, including the one never opened', () => {
    const fixture = render(
      session({ endedAt: START + 40 * MINUTE, endReason: 'expired', results: { 'js-dom-twin-node': { passed: 4, total: 4, runs: 2 } } }),
      'review',
      'js-dom-twin-node',
    );
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[data-testid="rehearsal-clock"]')).toBeNull();
    expect(host.querySelector('[data-testid="rehearsal-verdict"]')?.textContent?.trim()).toBe('Time is up. 1 of 2 problems pass every test.');
    expect(host.querySelector('[role="status"]')?.textContent?.trim()).toBe('Time is up. 1 of 2 problems pass every test.');
    expect(items(host)).toEqual([
      'Problem 1 Find the Corresponding Node in Twin DOM Trees All 4 tests pass',
      'Problem 2 Debounce Function Not opened',
    ]);

    let closed = false;
    fixture.componentInstance.closeReview.subscribe(() => (closed = true));
    (host.querySelector('[data-testid="rehearsal-close"]') as HTMLButtonElement).click();
    expect(closed).toBeTrue();
  });

  it('says how long an early end took, and which opened problems were never run', () => {
    const fixture = render(session({ endedAt: START + 27 * MINUTE, endReason: 'ended', reached: 1 }), 'review', 'js-debounce');
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[data-testid="rehearsal-verdict"]')?.textContent?.trim())
      .toBe('Ended after 27 min. 0 of 2 problems pass every test.');
    expect(items(host)).toEqual([
      'Problem 1 Find the Corresponding Node in Twin DOM Trees Not run',
      'Problem 2 Debounce Function Not run',
    ]);
  });

  it('formats the clock in minutes, and with hours past one', () => {
    expect(formatRehearsalClock(65_000)).toBe('1:05');
    expect(formatRehearsalClock(85 * MINUTE)).toBe('1:25:00');
    expect(formatRehearsalClock(1)).toBe('0:01');
    expect(formatRehearsalClock(-5)).toBe('0:00');
  });
});
