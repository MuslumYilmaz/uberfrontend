import type { InterviewModeSession } from '../models/editor-assist.model';
import { TimedPracticeClock } from './timed-practice-clock';

describe('TimedPracticeClock', () => {
  const START = new Date('2026-11-24T12:00:00Z').getTime();
  let stored: Map<string, InterviewModeSession>;
  let zone: { run: jasmine.Spy; runOutsideAngular: jasmine.Spy };

  const store = () => ({
    getInterviewSession: (questionId: string) => stored.get(questionId) ?? null,
    saveInterviewSession: (session: InterviewModeSession) => stored.set(session.questionId, session),
    clearInterviewSession: (questionId: string) => stored.delete(questionId),
  });
  const makeClock = (isBrowser = true) => {
    const clock: TimedPracticeClock = new TimedPracticeClock({
      zone: zone as any,
      isBrowser,
      store: store(),
      onExpired: () => clock.end(),
    });
    return clock;
  };

  beforeEach(() => {
    stored = new Map();
    zone = {
      run: jasmine.createSpy('run').and.callFake((fn: () => unknown) => fn()),
      runOutsideAngular: jasmine.createSpy('runOutsideAngular').and.callFake((fn: () => unknown) => fn()),
    };
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(START));
  });

  afterEach(() => jasmine.clock().uninstall());

  it('counts down outside the zone and ends itself with a summary when the time runs out', () => {
    const clock = makeClock();
    clock.start('js-debounce@1', 15);
    expect(clock.remainingLabel()).toBe('15:00 left');
    expect(zone.runOutsideAngular).toHaveBeenCalledTimes(1);
    expect(zone.run).not.toHaveBeenCalled();

    jasmine.clock().tick(61_000);
    expect(clock.remainingLabel()).toBe('13:59 left');
    // Each tick comes back into the zone only to update the seconds.
    expect(zone.run).toHaveBeenCalledTimes(61);
    clock.recordRun(1, 4);
    clock.recordRun(3, 4);
    clock.recordRun(2, 4);

    jasmine.clock().tick(14 * 60_000);
    expect(clock.active()).toBeFalse();
    expect(clock.summary()).toEqual({ runs: 3, bestPassPct: 75, elapsedSec: 900 });
    expect(stored.has('js-debounce@1')).toBeFalse();

    // The ticker stopped with the session.
    const ticks = zone.run.calls.count();
    jasmine.clock().tick(5_000);
    expect(zone.run.calls.count()).toBe(ticks);
  });

  it('picks up a running session after a reload and drops one whose time ran out', () => {
    makeClock().start('react-counter@1', 30);
    jasmine.clock().tick(10 * 60_000);

    const reloaded = makeClock();
    expect(reloaded.restore('react-counter@1')).toBe(30);
    expect(reloaded.active()).toBeTrue();
    expect(reloaded.remainingLabel()).toBe('20:00 left');

    jasmine.clock().mockDate(new Date(START + 31 * 60_000));
    const late = makeClock();
    expect(late.restore('react-counter@1')).toBeNull();
    expect(late.active()).toBeFalse();
    expect(stored.has('react-counter@1')).toBeFalse();
  });

  it('counts runs only while a session runs, and leaves the stored session for a reload on reset', () => {
    const clock = makeClock();
    clock.recordRun(4, 4);
    expect(stored.size).toBe(0);

    clock.start('vue-tabs@1', 45);
    clock.recordRun(0, 0);
    expect(stored.get('vue-tabs@1')).toEqual(jasmine.objectContaining({ runs: 1, bestPassPct: 0 }));

    clock.reset();
    expect(clock.active()).toBeFalse();
    expect(clock.summary()).toBeNull();
    expect(clock.end()).toBeNull();
    expect(stored.has('vue-tabs@1')).toBeTrue();
  });

  it('keeps no ticker on the server', () => {
    const clock = makeClock(false);
    clock.start('angular-counter@1', 15);
    expect(clock.active()).toBeTrue();
    expect(zone.runOutsideAngular).not.toHaveBeenCalled();
  });
});
