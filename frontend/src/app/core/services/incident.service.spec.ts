import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HttpRequest } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { IncidentService } from './incident.service';
import { QuestionPersistenceService } from './question-persistence.service';

describe('IncidentService', () => {
  let service: IncidentService;
  let httpMock: HttpTestingController;
  let persistence: QuestionPersistenceService;
  const cachePrefix = 'practice:cache:incidents:';

  const flushDataVersion = (version = 'practice-v1') => {
    const req = httpMock.expectOne((request) => request.url.includes('data-version.json'));
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [IncidentService],
    });

    service = TestBed.inject(IncidentService);
    httpMock = TestBed.inject(HttpTestingController);
    persistence = TestBed.inject(QuestionPersistenceService);
  });

  beforeEach(async () => {
    await persistence.clearByPrefix(cachePrefix);
    Object.keys(localStorage)
      .filter((key) => key.startsWith(cachePrefix))
      .forEach((key) => localStorage.removeItem(key));
  });

  afterEach(async () => {
    httpMock.verify();
    await persistence.clearByPrefix(cachePrefix);
    Object.keys(localStorage)
      .filter((key) => key.startsWith(cachePrefix))
      .forEach((key) => localStorage.removeItem(key));
  });

  it('loads the incident index from assets', async () => {
    const promise = firstValueFrom(service.loadIncidentIndex({ transferState: false }));
    flushDataVersion();

    const req = await waitForRequest(
      (request) => request.url.includes('assets/incidents/index.json'),
      'incident index fetch',
    );
    req.flush([
      {
        id: 'incident-1',
        title: 'Incident One',
        tech: 'angular',
        difficulty: 'easy',
        summary: 'Summary',
        signals: ['one'],
        estimatedMinutes: 12,
        tags: ['perf'],
        updatedAt: '2026-03-19',
        access: 'free',
      },
    ]);

    const result = await promise;
    expect(result.length).toBe(1);
    expect(result[0]?.id).toBe('incident-1');
    expect(result[0]?.tech).toBe('angular');
  });

  it('returns null when a scenario asset is not found', async () => {
    const promise = firstValueFrom(service.loadIncidentScenario('missing', { transferState: false }));
    flushDataVersion();

    const req = await waitForRequest(
      (request) => request.url.includes('assets/incidents/missing/scenario.json'),
      'incident scenario fetch',
    );
    req.flush({}, { status: 404, statusText: 'Not Found' });

    expect(await promise).toBeNull();
  });
});
