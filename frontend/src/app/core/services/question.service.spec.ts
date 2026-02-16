import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HttpRequest } from '@angular/common/http';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { Question } from '../models/question.model';
import { QuestionPersistenceService } from './question-persistence.service';
import { QuestionService } from './question.service';

describe('QuestionService', () => {
  let service: QuestionService;
  let persistence: QuestionPersistenceService;
  let httpMock: HttpTestingController;
  let transferState: TransferState;

  const cacheKey = 'qcache:javascript:coding';
  const overrideKey = 'qoverride:javascript:coding';
  const systemKey = 'qcache:system-design';
  const dvKey = 'qcache:dv';

  const makeCodingQuestion = (id: string): Partial<Question> => ({
    id,
    title: id,
    type: 'coding',
    technology: 'javascript',
    access: 'free',
    difficulty: 'easy',
    importance: 1,
  });

  const readCache = async (key: string): Promise<string | null> => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const value = await persistence.get(key);
      if (value) return value;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    return null;
  };

  const flushDataVersion = (version = 'bank-v1') => {
    const req = httpMock.expectOne((r) => r.url.includes('data-version.json'));
    req.flush({ dataVersion: version });
  };

  const waitForRequest = async (
    matcher: (request: HttpRequest<unknown>) => boolean,
    label: string,
  ) => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const matches = httpMock.match(matcher);
      if (matches.length > 0) return matches[0];
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error(`Expected request not observed: ${label}`);
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [QuestionService, QuestionPersistenceService],
    });

    service = TestBed.inject(QuestionService);
    persistence = TestBed.inject(QuestionPersistenceService);
    httpMock = TestBed.inject(HttpTestingController);
    transferState = TestBed.inject(TransferState);

    service.setCdnEnabled(false);

    await persistence.clearByPrefix('qcache:');
    await persistence.clearByPrefix('qoverride:');
    localStorage.removeItem('fa:cdn:enabled');
  });

  afterEach(async () => {
    httpMock.verify();
    await persistence.clearByPrefix('qcache:');
    await persistence.clearByPrefix('qoverride:');
    localStorage.removeItem('fa:cdn:enabled');
  });

  it('uses override before cache and network', async () => {
    await persistence.set(overrideKey, JSON.stringify([makeCodingQuestion('override-first')]));
    await persistence.set(cacheKey, JSON.stringify([makeCodingQuestion('cache-second')]));
    await persistence.set(dvKey, 'bank-v1');

    const resultPromise = firstValueFrom(service.loadQuestions('javascript', 'coding'));
    flushDataVersion('bank-v1');

    httpMock.expectNone((req) => req.url.includes('questions/javascript/coding.json'));
    const list = await resultPromise;
    expect(list[0]?.id).toBe('override-first');
  });

  it('returns cached questions from IndexedDB and skips question fetch', async () => {
    await persistence.set(cacheKey, JSON.stringify([makeCodingQuestion('cache-hit')]));
    await persistence.set(dvKey, 'bank-v1');

    const resultPromise = firstValueFrom(service.loadQuestions('javascript', 'coding'));
    flushDataVersion('bank-v1');

    httpMock.expectNone((req) => req.url.includes('questions/javascript/coding.json'));
    const list = await resultPromise;
    expect(list[0]?.id).toBe('cache-hit');
  });

  it('falls back to localStorage cache when IndexedDB has no entry', async () => {
    localStorage.setItem(cacheKey, JSON.stringify([makeCodingQuestion('ls-fallback')]));
    localStorage.setItem(dvKey, 'bank-v1');

    const resultPromise = firstValueFrom(service.loadQuestions('javascript', 'coding'));
    flushDataVersion('bank-v1');

    httpMock.expectNone((req) => req.url.includes('questions/javascript/coding.json'));
    const list = await resultPromise;
    expect(list[0]?.id).toBe('ls-fallback');
  });

  it('can bypass TransferState payload when transferState option is disabled', async () => {
    const tsKey = makeStateKey<Question[]>('questions:javascript:coding');
    transferState.set(tsKey, [makeCodingQuestion('transfer-hit') as Question]);

    const resultPromise = firstValueFrom(
      service.loadQuestions('javascript', 'coding', { transferState: false }),
    );
    flushDataVersion('bank-v1');

    const req = await waitForRequest(
      (r) => r.url.includes('questions/javascript/coding.json'),
      'coding fetch after transfer state bypass',
    );
    req.flush([makeCodingQuestion('network-hit')]);

    const list = await resultPromise;
    expect(list[0]?.id).toBe('network-hit');
  });

  it('invalidates qcache keys on version change but keeps overrides', async () => {
    await persistence.set(cacheKey, JSON.stringify([makeCodingQuestion('stale-cache')]));
    await persistence.set(overrideKey, JSON.stringify([makeCodingQuestion('override-kept')]));
    await persistence.set(dvKey, 'bank-v1');

    const resultPromise = firstValueFrom(service.loadQuestions('javascript', 'coding'));
    flushDataVersion('bank-v2');

    httpMock.expectNone((req) => req.url.includes('questions/javascript/coding.json'));
    const list = await resultPromise;

    expect(list[0]?.id).toBe('override-kept');
    expect(await persistence.get(cacheKey)).toBeNull();
    expect(localStorage.getItem(cacheKey)).toBeNull();
    expect(await persistence.get(overrideKey)).toContain('override-kept');
  });

  it('caches system-design list and reuses cache on later reads', async () => {
    const sysList = [{ id: 'sys-1', title: 'System', access: 'free' }];

    const first = firstValueFrom(service.loadSystemDesign());
    flushDataVersion('bank-v1');
    const req = await waitForRequest(
      (r) => r.url.includes('questions/system-design/index.json'),
      'system design index fetch',
    );
    req.flush(sysList);
    expect(await first).toEqual(sysList as any);

    const second = await firstValueFrom(service.loadSystemDesign());
    httpMock.expectNone((r) => r.url.includes('questions/system-design/index.json'));
    expect(second).toEqual(sysList as any);
    expect(await persistence.get(systemKey)).toContain('"sys-1"');
  });

  it('dual-writes overrides to IndexedDB and localStorage', async () => {
    service.setLocalOverride('javascript', 'coding', [makeCodingQuestion('dual-write')]);

    expect(localStorage.getItem(overrideKey)).toContain('dual-write');
    const persisted = await readCache(overrideKey);
    expect(persisted).toContain('dual-write');
  });
});
