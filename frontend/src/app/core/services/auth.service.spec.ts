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

  it('dedupes concurrent /me hydration requests and applies the shared user once', async () => {
    authority.noteSessionHintPresent();

    const first = firstValueFrom(service.fetchMe());
    const second = firstValueFrom(service.ensureMe());

    const meRequests = httpMock.match((request) =>
      request.method === 'GET' &&
      request.url.endsWith('/api/auth/me')
    );
    expect(meRequests.length).toBe(1);
    meRequests[0].flush(sampleUser);

    const [firstResult, secondResult] = await Promise.all([first, second]);
    expect(firstResult?.email).toBe('test@example.com');
    expect(secondResult?.email).toBe('test@example.com');
    expect(service.user()?.email).toBe('test@example.com');
    expect(authority.state()).toBe('authenticated');
    expect(authority.hasSessionHint()).toBeTrue();
  });

  it('requests an email verification without mutating the current user optimistically', async () => {
    service.user.set(sampleUser);
    const result = firstValueFrom(service.requestEmailVerification('new@example.com'));
    const req = httpMock.expectOne((request) =>
      request.method === 'POST' && request.url.endsWith('/api/auth/email-verification/request')
    );
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.body).toEqual({ email: 'new@example.com' });
    req.flush({ ok: true, purpose: 'change_email', expiresAt: new Date().toISOString() });

    expect((await result).purpose).toBe('change_email');
    expect(service.user()?.email).toBe('test@example.com');
  });

  it('applies the provider-safe user contract after email confirmation', async () => {
    const confirmedUser: User = {
      ...sampleUser,
      emailVerified: true,
      pendingEmail: null,
      linkedProviders: ['google'],
    };
    const result = firstValueFrom(service.confirmEmailVerification('verification-token'));
    const req = httpMock.expectOne((request) =>
      request.method === 'POST' && request.url.endsWith('/api/auth/email-verification/confirm')
    );
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.body).toEqual({ token: 'verification-token' });
    req.flush({ ok: true, user: confirmedUser });

    expect((await result).user.emailVerified).toBeTrue();
    expect(service.user()?.linkedProviders).toEqual(['google']);
  });

  it('preserves stable OAuth conflict codes from the callback query', async () => {
    const error = await firstValueFrom(service.completeOAuthCallback({
      error: 'An account already uses this email.',
      code: 'OAUTH_EMAIL_CONFLICT',
    })).catch((value) => value);

    expect(error?.status).toBe(400);
    expect(error?.error?.code).toBe('OAUTH_EMAIL_CONFLICT');
    expect(error?.error?.error).toContain('already uses this email');
  });
});
