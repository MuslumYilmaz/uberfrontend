import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom, of } from 'rxjs';
import { AnalyticsService } from './analytics.service';
import { RehearsalService } from './rehearsal.service';

const REHEARSAL_ENTRY = {
  id: 'meta-full-loop-coding',
  access: 'premium',
  company: 'meta',
  title: 'Meta coding round',
  round: 'Full loop: coding',
  summary: 'About two problems in about 40 minutes.',
  minutes: 40,
  order: 'sequential',
  items: [
    { path: '/javascript/coding/js-dom-twin-node', title: 'Find the Corresponding Node in Twin DOM Trees' },
    { path: '/javascript/coding/js-debounce', title: 'Debounce Function' },
  ],
};

const STORAGE_KEY = 'fa:rehearsal:v1';
const START = Date.UTC(2026, 10, 7, 12, 0, 0);
const MINUTE = 60_000;

describe('RehearsalService', () => {
  let analytics: jasmine.SpyObj<AnalyticsService>;

  const create = (): RehearsalService => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AnalyticsService, useValue: analytics }],
    });
    return TestBed.inject(RehearsalService);
  };

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(START));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    jasmine.clock().uninstall();
    localStorage.removeItem(STORAGE_KEY);
  });

  it('keeps the rehearsals of JavaScript tasks and leaves out one the panel could not run', () => {
    const service = create();
    expect(service.normalize(REHEARSAL_ENTRY)?.items.map((item) => item.questionId)).toEqual(['js-dom-twin-node', 'js-debounce']);

    const [first, second] = REHEARSAL_ENTRY.items;
    const react = { path: '/react/coding/react-counter', title: 'Counter' };
    expect(service.normalize({ ...REHEARSAL_ENTRY, items: [first, react] })).toBeNull();
    expect(service.normalize({ ...REHEARSAL_ENTRY, items: [first, first] })).toBeNull();
    expect(service.normalize({ ...REHEARSAL_ENTRY, items: [second] })).toBeNull();
    expect(service.normalize({ ...REHEARSAL_ENTRY, minutes: 0 })).toBeNull();

    const broken = { ...REHEARSAL_ENTRY, id: 'broken', minutes: 0 };
    const list = service.normalizeList({ schemaVersion: 1, rehearsals: [REHEARSAL_ENTRY, broken, { ...REHEARSAL_ENTRY, title: 'Copy' }] });
    expect(list.map((definition) => definition.title)).toEqual(['Meta coding round']);
    expect(service.normalizeList({ schemaVersion: 2, rehearsals: [REHEARSAL_ENTRY] })).toEqual([]);
  });

  it('offers a task page the rehearsals that list it', async () => {
    const service = create();
    spyOn(service, 'loadAll').and.returnValue(of([service.normalize(REHEARSAL_ENTRY)!]));
    expect((await firstValueFrom(service.forTask('/javascript/coding/js-debounce'))).map((definition) => definition.id))
      .toEqual(['meta-full-loop-coding']);
    expect(await firstValueFrom(service.forTask('/javascript/coding/js-throttle'))).toEqual([]);
  });

  it("runs one clock across the tasks and keeps each task's best run", () => {
    const service = create();
    service.start(service.normalize(REHEARSAL_ENTRY)!, 'js-debounce');
    expect(service.phase()).toBe('active');
    expect(service.remainingMs()).toBe(40 * MINUTE);
    expect(service.draftKey('js-debounce')).toBe(`rehearsal:meta-full-loop-coding:${START}:js-debounce`);
    expect(service.draftKey('js-throttle')).toBeNull();

    jasmine.clock().tick(10 * MINUTE);
    expect(service.remainingMs()).toBe(30 * MINUTE);
    service.record('js-debounce', 2, 3);
    service.record('js-debounce', 1, 3);
    expect(service.session()?.results['js-debounce']).toEqual({ passed: 2, total: 3, runs: 2 });
    service.record('js-debounce', 3, 3);
    expect(service.session()?.results['js-debounce']).toEqual({ passed: 3, total: 3, runs: 3 });
    // A runner error reads as 0 of 1; the real suite that fails just as much replaces it.
    service.record('js-dom-twin-node', 0, 1);
    service.record('js-dom-twin-node', 0, 4);
    expect(service.session()?.results['js-dom-twin-node']).toEqual({ passed: 0, total: 4, runs: 2 });
    service.record('js-throttle', 3, 3);
    expect(service.session()?.results['js-throttle']).toBeUndefined();
    expect(analytics.track).toHaveBeenCalledWith('rehearsal_started', jasmine.objectContaining({
      rehearsal_id: 'meta-full-loop-coding',
      question_id: 'js-debounce',
    }));
  });

  it('stops at the deadline: the review opens and later runs no longer count', () => {
    const service = create();
    service.start(service.normalize(REHEARSAL_ENTRY)!);
    jasmine.clock().tick(40 * MINUTE + 1000);
    expect(service.phase()).toBe('review');
    expect(service.session()?.endReason).toBe('expired');
    expect(service.session()?.endedAt).toBe(START + 40 * MINUTE);

    service.record('js-debounce', 3, 3);
    expect(service.session()?.results['js-debounce']).toBeUndefined();
    expect(analytics.track).toHaveBeenCalledWith('rehearsal_ended', jasmine.objectContaining({
      reason: 'expired',
      passed_items: 0,
      items: 2,
      elapsed_sec: 2400,
    }));
  });

  it('ends early on request, then closes the review back to no rehearsal', () => {
    const service = create();
    service.start(service.normalize(REHEARSAL_ENTRY)!);
    jasmine.clock().tick(5 * MINUTE);
    service.end();
    expect(service.phase()).toBe('review');
    expect(service.session()?.endReason).toBe('ended');

    service.close();
    expect(service.session()).toBeNull();
    expect(service.phase()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('picks a running rehearsal up after a reload and drops a damaged one', () => {
    const first = create();
    first.start(first.normalize(REHEARSAL_ENTRY)!);
    first.reach('js-debounce');
    TestBed.resetTestingModule();

    jasmine.clock().tick(MINUTE);
    const reloaded = create();
    expect(reloaded.session()?.reached).toBe(1);
    expect(reloaded.remainingMs()).toBe(39 * MINUTE);
    jasmine.clock().tick(39 * MINUTE);
    expect(reloaded.phase()).toBe('review');
    TestBed.resetTestingModule();

    localStorage.setItem(STORAGE_KEY, '{"version":1,"key":"x"}');
    expect(create().session()).toBeNull();
  });
});
