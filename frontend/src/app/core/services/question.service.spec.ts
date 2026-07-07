import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HttpRequest } from '@angular/common/http';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { Question } from '../models/question.model';
import { QuestionPersistenceService } from './question-persistence.service';
import { QuestionService } from './question.service';

class MemoryQuestionPersistenceService {
  private readonly store = new Map<string, string>();

  async get(keyRaw: string): Promise<string | null> {
    const key = String(keyRaw ?? '').trim();
    if (!key) return null;
    return this.store.get(key) ?? localStorage.getItem(key);
  }

  async set(keyRaw: string, valueRaw: string): Promise<void> {
    const key = String(keyRaw ?? '').trim();
    if (!key) return;
    const value = String(valueRaw ?? '');
    this.store.set(key, value);
    localStorage.setItem(key, value);
  }

  async remove(keyRaw: string): Promise<void> {
    const key = String(keyRaw ?? '').trim();
    if (!key) return;
    this.store.delete(key);
    localStorage.removeItem(key);
  }

  async clearByPrefix(prefixRaw: string): Promise<void> {
    const prefix = String(prefixRaw ?? '').trim();
    if (!prefix) return;
    Array.from(this.store.keys())
      .filter((key) => key.startsWith(prefix))
      .forEach((key) => this.store.delete(key));
    Object.keys(localStorage)
      .filter((key) => key.startsWith(prefix))
      .forEach((key) => localStorage.removeItem(key));
  }
}

describe('QuestionService', () => {
  let service: QuestionService;
  let persistence: QuestionPersistenceService;
  let httpMock: HttpTestingController;
  let transferState: TransferState;

  const cacheKey = 'qcache:javascript:coding';
  const overrideKey = 'qoverride:javascript:coding';
  const systemKey = 'qcache:system-design';
  const dvKey = 'qcache:dv';
  const cdnFlagKey = 'fa:cdn:enabled';
  const codingTransferStateKey = makeStateKey<Question[]>('questions:javascript:coding');
  const systemDesignTransferStateKey = makeStateKey<any[]>('system-design:index');
  const dataVersionTransferStateKey = makeStateKey<string>('practice:data-version');

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

  const clearQuestionStorage = async () => {
    await persistence.clearByPrefix('qcache:');
    await persistence.clearByPrefix('qoverride:');

    Object.keys(localStorage)
      .filter((key) =>
        key.startsWith('qcache:')
        || key.startsWith('qoverride:')
        || key === cdnFlagKey
      )
      .forEach((key) => localStorage.removeItem(key));
  };

  const clearTransferState = () => {
    transferState.remove(codingTransferStateKey);
    transferState.remove(systemDesignTransferStateKey);
    transferState.remove(dataVersionTransferStateKey);
  };

  beforeEach(async () => {
    localStorage.setItem(cdnFlagKey, '0');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        QuestionService,
        {
          provide: QuestionPersistenceService,
          useClass: MemoryQuestionPersistenceService,
        },
      ],
    });

    service = TestBed.inject(QuestionService);
    persistence = TestBed.inject(QuestionPersistenceService);
    httpMock = TestBed.inject(HttpTestingController);
    transferState = TestBed.inject(TransferState);

    clearTransferState();
    await clearQuestionStorage();
    localStorage.setItem(cdnFlagKey, '0');
  });

  afterEach(async () => {
    try {
      httpMock.verify();
    } finally {
      clearTransferState();
      await clearQuestionStorage();
    }
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
    transferState.set(codingTransferStateKey, [makeCodingQuestion('transfer-hit') as Question]);

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

  it('does not cache an empty question list produced by a failed asset fetch', async () => {
    const resultPromise = firstValueFrom(service.loadQuestions('javascript', 'coding'));
    flushDataVersion('bank-v1');

    const req = await waitForRequest(
      (r) => r.url.includes('questions/javascript/coding.json'),
      'failed coding fetch',
    );
    req.flush('server error', { status: 500, statusText: 'Server Error' });

    const list = await resultPromise;
    expect(list).toEqual([]);
    expect(await persistence.get(cacheKey)).toBeNull();
  });

  it('caches a successful empty question list response', async () => {
    const resultPromise = firstValueFrom(service.loadQuestions('javascript', 'coding'));
    flushDataVersion('bank-v1');

    const req = await waitForRequest(
      (r) => r.url.includes('questions/javascript/coding.json'),
      'successful empty coding fetch',
    );
    req.flush([]);

    const list = await resultPromise;
    expect(list).toEqual([]);
    expect(await persistence.get(cacheKey)).toBe('[]');
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

  it('can bypass TransferState payload for system-design index when transferState is disabled', async () => {
    transferState.set(systemDesignTransferStateKey, [{ id: 'sys-transfer' }]);

    const resultPromise = firstValueFrom(
      service.loadSystemDesign({ transferState: false }),
    );
    flushDataVersion('bank-v1');

    const req = await waitForRequest(
      (r) => r.url.includes('questions/system-design/index.json'),
      'system design fetch after transfer state bypass',
    );
    req.flush([{ id: 'sys-network', title: 'Network item', access: 'free' }]);

    const list = await resultPromise;
    expect(list[0]?.id).toBe('sys-network');
  });

  it('maps detail-grade questions into list-safe summaries', async () => {
    const resultPromise = firstValueFrom(
      service.loadQuestionSummaries('javascript', 'coding', { transferState: false }),
    );
    flushDataVersion('bank-v1');

    const req = await waitForRequest(
      (r) => r.url.includes('questions/javascript/coding.json'),
      'coding summaries fetch',
    );
    req.flush([
      {
        ...makeCodingQuestion('summary-hit'),
        tags: ['async'],
        description: { summary: 'Short description for list views.' },
        solution: 'heavy payload that should not be returned by summaries',
      },
    ]);

    const list = await resultPromise;
    expect(list[0]?.id).toBe('summary-hit');
    expect(list[0]?.shortDescription).toContain('Short description');
    expect((list[0] as any).solution).toBeUndefined();
  });

  it('dual-writes overrides to IndexedDB and localStorage', async () => {
    service.setLocalOverride('javascript', 'coding', [makeCodingQuestion('dual-write')]);

    expect(localStorage.getItem(overrideKey)).toContain('dual-write');
    const persisted = await readCache(overrideKey);
    expect(persisted).toContain('dual-write');
  });
});
