import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService, User } from './auth.service';
import { AuthSessionAuthorityService } from './auth-session-authority.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let authority: AuthSessionAuthorityService;

  const sampleUser: User = {
    _id: 'user-1',
    username: 'test-user',
    email: 'test@example.com',
    role: 'user',
    accessTier: 'free',
    prefs: {
      tz: 'Europe/Istanbul',
      theme: 'dark',
      defaultTech: 'javascript',
      keyboard: 'default',
      marketingEmails: false,
    },
    solvedQuestionIds: [],
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, AuthSessionAuthorityService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    authority = TestBed.inject(AuthSessionAuthorityService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('clears local auth state when /me returns an unrecoverable auth error', async () => {
    service.user.set(sampleUser);
    authority.noteSessionHintPresent();

    const resultPromise = firstValueFrom(service.fetchMe());
    const req = httpMock.expectOne((request) =>
      request.method === 'GET' &&
      request.url.endsWith('/api/auth/me')
    );
    req.flush(
      { code: 'AUTH_INVALID', error: 'Invalid or expired token' },
      { status: 401, statusText: 'Unauthorized' },
    );

    const result = await resultPromise;
    expect(result).toBeNull();
    expect(service.user()).toBeNull();
    expect(authority.state()).toBe('signed_out');
    expect(authority.hasSessionHint()).toBeFalse();
  });

  it('ignores a stale /me success after logout wins the auth epoch', fakeAsync(() => {
    let resolved: User | null | undefined;
    firstValueFrom(service.fetchMe()).then((value) => {
      resolved = value;
    });

    const meReq = httpMock.expectOne((request) =>
      request.method === 'GET' &&
      request.url.endsWith('/api/auth/me')
    );

    firstValueFrom(service.logout());
    const logoutReq = httpMock.expectOne((request) =>
      request.method === 'POST' &&
      request.url.endsWith('/api/auth/logout')
    );
    logoutReq.flush({ ok: true });

    meReq.flush(sampleUser);
    tick();

    expect(resolved).toBeNull();
    expect(service.user()).toBeNull();
    expect(authority.state()).toBe('signed_out');
  }));

  it('signs out when another tab broadcasts logout', () => {
    service.user.set(sampleUser);
    authority.noteSessionHintPresent();

    window.dispatchEvent(new StorageEvent('storage', {
      key: 'fa:auth:event',
      newValue: JSON.stringify({
        type: 'logout',
        originId: 'other-tab',
        epoch: 99,
        local: false,
        at: Date.now(),
      }),
    }));

    expect(service.user()).toBeNull();
    expect(authority.state()).toBe('signed_out');
    expect(authority.hasSessionHint()).toBeFalse();
  });

  it('hydrates the signed-in user after another tab broadcasts login', () => {
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'fa:auth:event',
      newValue: JSON.stringify({
        type: 'login',
        originId: 'other-tab',
        epoch: 42,
        local: false,
        at: Date.now(),
      }),
    }));

    const req = httpMock.expectOne((request) =>
      request.method === 'GET' &&
      request.url.endsWith('/api/auth/me')
    );
    req.flush(sampleUser);

    expect(service.user()?.email).toBe('test@example.com');
    expect(authority.state()).toBe('authenticated');
    expect(authority.hasSessionHint()).toBeTrue();
  });

  it('returns a friendly bootstrap error when login succeeds but /me cannot establish a session', async () => {
    const loginPromise = firstValueFrom(service.login({
      emailOrUsername: 'test@example.com',
      password: 'secret123',
    })).catch((error) => error);

    const loginReq = httpMock.expectOne((request) =>
      request.method === 'POST' &&
      request.url.endsWith('/api/auth/login')
    );
    loginReq.flush({ user: sampleUser });

    const meReq = httpMock.expectOne((request) =>
      request.method === 'GET' &&
      request.url.endsWith('/api/auth/me')
    );
    meReq.flush(
      { code: 'AUTH_INVALID', error: 'Invalid or expired token' },
      { status: 401, statusText: 'Unauthorized' },
    );

    const error = await loginPromise;
    expect(error?.error?.code).toBe('AUTH_SESSION_BOOTSTRAP_FAILED');
    expect(error?.error?.error).toBe('We could not sign you in. Please try again.');
  });

  it('dedupes identical in-flight login attempts and reuses the same auth request headers', async () => {
    const first = firstValueFrom(service.login({
      emailOrUsername: 'test@example.com',
      password: 'secret123',
    }));
    const second = firstValueFrom(service.login({
      emailOrUsername: ' test@example.com ',
      password: 'secret123',
    }));

    const loginRequests = httpMock.match((request) =>
      request.method === 'POST' &&
      request.url.endsWith('/api/auth/login')
    );
    expect(loginRequests.length).toBe(1);
    expect(loginRequests[0].request.headers.has('X-Auth-Context-Id')).toBeTrue();
    expect(loginRequests[0].request.headers.has('X-Auth-Request-Id')).toBeTrue();
    loginRequests[0].flush({ user: sampleUser });

    const meRequests = httpMock.match((request) =>
      request.method === 'GET' &&
      request.url.endsWith('/api/auth/me')
    );
    expect(meRequests.length).toBe(1);
    meRequests[0].flush(sampleUser);

    const [firstResult, secondResult] = await Promise.all([first, second]);
    expect(firstResult.email).toBe('test@example.com');
    expect(secondResult.email).toBe('test@example.com');
  });
});
