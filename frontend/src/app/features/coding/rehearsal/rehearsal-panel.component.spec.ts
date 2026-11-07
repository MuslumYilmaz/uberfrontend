import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RehearsalDefinition, RehearsalSession } from '../../../core/models/rehearsal.model';
import { RehearsalPanelComponent, formatRehearsalClock, rehearsalHeading } from './rehearsal-panel.component';

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
  answers: [],
  answering: 0,
  ...patch,
});
const KARAT: RehearsalDefinition = {
  ...DEFINITION,
  id: 'walmart-karat-screen',
  title: 'Walmart Karat screen',
  minutes: 55,
  shortAnswers: {
    minutes: 10,
    questions: [
      { question: 'What is a closure?', answer: 'A function that keeps its scope.', path: '/javascript/trivia/js-closures' },
      { question: 'What does `box-sizing: border-box` change?', answer: 'Width includes padding and border.', path: '/css/trivia/css-box-model' },
      { question: 'What is useEffect for?', answer: 'Syncing with the outside world.', path: '/react/trivia/react-useeffect-purpose' },
    ],
  },
};
const karat = (patch: Partial<RehearsalSession> = {}) =>
  session({ definition: KARAT, key: `walmart-karat-screen:${START}`, answers: ['', '', ''], ...patch });

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

  it('asks the short answers before the problems, which wait out of sight', () => {
    const fixture = render(karat(), 'active', 'js-dom-twin-node', 55 * MINUTE);
    const host = fixture.nativeElement as HTMLElement;
    const text = (id: string) => host.querySelector(`[data-testid="${id}"]`)?.textContent?.replace(/\s+/g, ' ').trim();
    expect(text('rehearsal-questions')).toContain('Short answers: question 1 of 3');
    expect(text('rehearsal-question')).toBe('What is a closure?');
    expect(text('rehearsal-question-note')).toBe('The reports give these questions about 10 minutes. The clock keeps running for the whole screen.');
    expect(items(host)).toEqual(['Problem 1 Opens after the short answers', 'Problem 2 Opens after the short answers']);
    expect(host.querySelector('[data-testid="rehearsal-next"]')).toBeNull();
    expect(text('rehearsal-question-next')).toBe('Next question');

    const emitted: string[] = [];
    fixture.componentInstance.answer.subscribe((value) => emitted.push(`answer:${value}`));
    fixture.componentInstance.nextQuestion.subscribe(() => emitted.push('next'));
    fixture.componentInstance.skipToProblems.subscribe(() => emitted.push('skip'));
    const box = host.querySelector('[data-testid="rehearsal-answer"]') as HTMLTextAreaElement;
    expect(box.getAttribute('aria-describedby')).toBe('rehearsal-question-text');
    box.value = 'It keeps its scope';
    box.dispatchEvent(new Event('input'));
    (host.querySelector('[data-testid="rehearsal-question-next"]') as HTMLButtonElement).click();
    expect(document.activeElement).toBe(box);
    (host.querySelector('[data-testid="rehearsal-skip"]') as HTMLButtonElement).click();
    expect(emitted).toEqual(['answer:It keeps its scope', 'next', 'skip']);
  });

  it('offers the problems after the last question, and says when the reported time has passed', () => {
    const fixture = render(karat({ answering: 2, answers: ['Scope', '', 'Syncing'] }), 'active', 'js-dom-twin-node', 44 * MINUTE);
    const host = fixture.nativeElement as HTMLElement;
    expect((host.querySelector('[data-testid="rehearsal-answer"]') as HTMLTextAreaElement).value).toBe('Syncing');
    expect(host.querySelector('[data-testid="rehearsal-question-next"]')?.textContent?.trim()).toBe('Move on to the problems');
    expect(host.querySelector('[data-testid="rehearsal-skip"]')).toBeNull();
    expect(host.querySelector('[data-testid="rehearsal-question-note"]')?.textContent?.trim())
      .toBe('About 10 minutes have passed, which is when the reported screen moves on to coding.');

    // Once the questions are done, the problems are back.
    fixture.componentRef.setInput('session', karat({ answering: 3, answers: ['Scope', '', 'Syncing'] }));
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="rehearsal-questions"]')).toBeNull();
    expect(items(host)).toEqual([
      'Problem 1 Find the Corresponding Node in Twin DOM Trees Not run yet',
      'Problem 2 Opens when you move on',
    ]);
  });

  it('reviews each short answer beside a sample one, with the full answer a link away', () => {
    const fixture = render(
      karat({ endedAt: START + 55 * MINUTE, endReason: 'expired', answering: 3, answers: ['  It keeps its scope ', '', 'Syncing'] }),
      'review',
      'js-dom-twin-node',
    );
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[data-testid="rehearsal-verdict"]')?.textContent?.trim())
      .toBe('Time is up. 0 of 2 problems pass every test. You answered 2 of 3 short questions.');
    const reviewed = Array.from(host.querySelectorAll<HTMLElement>('[data-testid="rehearsal-answer-review"]'));
    // Each line as it reads on screen, spaces included.
    expect(reviewed.map((entry) => Array.from(entry.children).map((line) => line.textContent).join(' | '))).toEqual([
      'What is a closure? | Your answer: It keeps its scope | A sample answer: A function that keeps its scope. | Read the full answer',
      'What does box-sizing: border-box change? | Your answer: No answer | A sample answer: Width includes padding and border. | Read the full answer',
      'What is useEffect for? | Your answer: Syncing | A sample answer: Syncing with the outside world. | Read the full answer',
    ]);
    expect(reviewed.map((entry) => entry.querySelector('a')?.getAttribute('href'))).toEqual([
      '/javascript/trivia/js-closures',
      '/css/trivia/css-box-model',
      '/react/trivia/react-useeffect-purpose',
    ]);
    expect(reviewed[1].querySelector('code')?.textContent).toBe('box-sizing: border-box');
  });

  it('names the short answers in the heading of a rehearsal that opens with them', () => {
    expect(rehearsalHeading(DEFINITION)).toBe('Meta coding round: 2 problems in 40 minutes');
    expect(rehearsalHeading(KARAT)).toBe('Walmart Karat screen: 3 short answers and 2 problems in 55 minutes');
  });

  it('formats the clock in minutes, and with hours past one', () => {
    expect(formatRehearsalClock(65_000)).toBe('1:05');
    expect(formatRehearsalClock(85 * MINUTE)).toBe('1:25:00');
    expect(formatRehearsalClock(1)).toBe('0:01');
    expect(formatRehearsalClock(-5)).toBe('0:00');
  });
});
