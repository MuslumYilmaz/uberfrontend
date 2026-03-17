import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthSessionAuthorityService } from '../services/auth-session-authority.service';
import { authRefreshInterceptor } from './auth-refresh.interceptor';
import { apiUrl } from '../utils/api-base';

describe('authRefreshInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authority: AuthSessionAuthorityService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthSessionAuthorityService,
        provideHttpClient(withInterceptors([authRefreshInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authority = TestBed.inject(AuthSessionAuthorityService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('forces a sign out when refresh fails with an unrecoverable auth code', async () => {
    authority.noteSessionHintPresent();

    const requestPromise = firstValueFrom(
      http.get(apiUrl('/profile'), { withCredentials: true }),
    ).catch((error) => error);

    const protectedReq = httpMock.expectOne(apiUrl('/profile'));
    protectedReq.flush(
      { code: 'AUTH_INVALID', error: 'Invalid or expired token' },
      { status: 401, statusText: 'Unauthorized' },
    );

    const refreshReq = httpMock.expectOne(apiUrl('/auth/refresh'));
    refreshReq.flush(
      { code: 'REFRESH_INVALID', error: 'Invalid or expired refresh session' },
      { status: 401, statusText: 'Unauthorized' },
    );

    await requestPromise;

    expect(authority.state()).toBe('signed_out');
    expect(authority.hasSessionHint()).toBeFalse();
  });

  it('deduplicates concurrent refresh attempts and retries waiting requests', async () => {
    authority.noteSessionHintPresent();

    const firstPromise = firstValueFrom(http.get(apiUrl('/dashboard'), { withCredentials: true }));
    const secondPromise = firstValueFrom(http.get(apiUrl('/profile'), { withCredentials: true }));

    const initialRequests = httpMock.match((request) =>
      request.method === 'GET' &&
      (request.url === apiUrl('/dashboard') || request.url === apiUrl('/profile'))
    );
    expect(initialRequests.length).toBe(2);

    for (const request of initialRequests) {
      request.flush(
        { code: 'AUTH_INVALID', error: 'Invalid or expired token' },
        { status: 401, statusText: 'Unauthorized' },
      );
    }

    const refreshRequests = httpMock.match(apiUrl('/auth/refresh'));
    expect(refreshRequests.length).toBe(1);
    refreshRequests[0].flush({ ok: true });

    const retried = httpMock.match((request) =>
      request.method === 'GET' &&
      (request.url === apiUrl('/dashboard') || request.url === apiUrl('/profile'))
    );
    expect(retried.length).toBe(2);
    retried.find((request) => request.request.url === apiUrl('/dashboard'))?.flush({ ok: true, page: 'dashboard' });
    retried.find((request) => request.request.url === apiUrl('/profile'))?.flush({ ok: true, page: 'profile' });

    const [first, second] = await Promise.all([firstPromise, secondPromise]);
    expect(first).toEqual(jasmine.objectContaining({ page: 'dashboard' }));
    expect(second).toEqual(jasmine.objectContaining({ page: 'profile' }));
  });
});
