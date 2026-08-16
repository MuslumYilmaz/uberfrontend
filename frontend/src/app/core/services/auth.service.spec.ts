import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
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
    sessionStorage.clear();

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
    sessionStorage.clear();
  });

  function completeInitialRender(): void {
    TestBed.inject(ApplicationRef).tick();
  }

  it('keeps auth UI pending through SSR-compatible initialization and the first client render', () => {
    expect(authority.state()).toBe('signed_out');
    expect(service.authUiState()).toBe('pending');
  });

  it('reveals signed-out UI after the first client render when there is no session hint', () => {
    expect(authority.hasSessionHint()).toBeFalse();

    completeInitialRender();

    expect(service.authUiState()).toBe('signed_out');
  });

  it('stays pending while /me is delayed and becomes authenticated when the user arrives', async () => {
    authority.noteSessionHintPresent();
    authority.state.set('unknown');

    const resultPromise = firstValueFrom(service.fetchMe());
    const req = httpMock.expectOne((request) =>
      request.method === 'GET' &&
      request.url.endsWith('/api/auth/me')
    );

    completeInitialRender();
    expect(service.authUiState()).toBe('pending');

    req.flush(sampleUser);
    await resultPromise;

    expect(service.authUiState()).toBe('authenticated');
  });

  it('moves from pending to signed out when a stale session hint receives 401', async () => {
    authority.noteSessionHintPresent();
    authority.state.set('unknown');

    const resultPromise = firstValueFrom(service.fetchMe());
    const req = httpMock.expectOne((request) =>
      request.method === 'GET' &&
      request.url.endsWith('/api/auth/me')
    );

    completeInitialRender();
    expect(service.authUiState()).toBe('pending');

    req.flush(
      { code: 'AUTH_INVALID', error: 'Invalid or expired token' },
      { status: 401, statusText: 'Unauthorized' },
    );
    await resultPromise;

    expect(service.authUiState()).toBe('signed_out');
  });

  it('keeps authenticated UI visible while an existing user session refreshes', () => {
    service.user.set(sampleUser);
    authority.state.set('refreshing');

    expect(service.authUiState()).toBe('pending');

    completeInitialRender();

    expect(service.authUiState()).toBe('authenticated');
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

  it('returns account creation and verification requirements from signup after hydration', async () => {
    const result = firstValueFrom(service.signup({
      email: 'test@example.com', username: 'test-user', password: 'secret123',
    }));
    const signupReq = httpMock.expectOne((request) =>
      request.method === 'POST' && request.url.endsWith('/api/auth/signup')
    );
    signupReq.flush({
      user: sampleUser,
      accountCreated: true,
      verificationEmailRequired: true,
    });
    const meReq = httpMock.expectOne((request) =>
      request.method === 'GET' && request.url.endsWith('/api/auth/me')
    );
    meReq.flush(sampleUser);

    expect(await result).toEqual(jasmine.objectContaining({
      user: jasmine.objectContaining({ email: 'test@example.com' }),
      accountCreated: true,
      verificationEmailRequired: true,
    }));
  });

  it('preserves backend account-created truth when follow-up hydration fails', async () => {
    const result = firstValueFrom(service.signup({
      email: 'test@example.com', username: 'test-user', password: 'secret123',
    }));
    httpMock.expectOne((request) =>
      request.method === 'POST' && request.url.endsWith('/api/auth/signup')
    ).flush({
      user: sampleUser,
      accountCreated: true,
      verificationEmailRequired: true,
    });
    httpMock.expectOne((request) =>
      request.method === 'GET' && request.url.endsWith('/api/auth/me')
    ).flush({ error: 'temporary' }, { status: 503, statusText: 'Unavailable' });

    expect(await result).toEqual(jasmine.objectContaining({
      user: jasmine.objectContaining({ email: 'test@example.com' }),
      accountCreated: true,
      verificationEmailRequired: true,
    }));
  });

  it('uses the generic password reset request and confirm contracts', async () => {
    const requested = firstValueFrom(service.requestPasswordReset('test@example.com'));
    const requestReq = httpMock.expectOne((request) =>
      request.method === 'POST' && request.url.endsWith('/api/auth/password-reset/request')
    );
    expect(requestReq.request.body).toEqual({ email: 'test@example.com' });
    expect(requestReq.request.withCredentials).toBeTrue();
    requestReq.flush({ ok: true }, { status: 202, statusText: 'Accepted' });
    expect((await requested).ok).toBeTrue();

    service.user.set(sampleUser);
    const confirmed = firstValueFrom(service.confirmPasswordReset('reset-token', 'new-secret-456'));
    const confirmReq = httpMock.expectOne((request) =>
      request.method === 'POST' && request.url.endsWith('/api/auth/password-reset/confirm')
    );
    expect(confirmReq.request.body).toEqual({ token: 'reset-token', newPassword: 'new-secret-456' });
    confirmReq.flush({ ok: true });
    expect((await confirmed).ok).toBeTrue();
    expect(service.user()).toBeNull();
  });

  it('returns the backend OAuth action and scrubs it from the callback URL', async () => {
    window.history.replaceState({}, '', '/auth/callback?action=signup&state=oauth-state');
    sessionStorage.setItem('oauth:state', 'oauth-state');
    const result = firstValueFrom(service.completeOAuthCallback({ action: 'signup', state: 'oauth-state' }));
    const meReq = httpMock.expectOne((request) =>
      request.method === 'GET' && request.url.endsWith('/api/auth/me')
    );
    meReq.flush(sampleUser);

    expect((await result).action).toBe('signup');
    expect(window.location.search).not.toContain('action=');
    expect(window.location.search).not.toContain('state=');
  });

  it('rejects OAuth callbacks that are not bound to the initiating browser state', async () => {
    const error = await firstValueFrom(service.completeOAuthCallback({ action: 'signup' }))
      .catch((value) => value);

    expect(error?.message).toBe('Invalid OAuth state');
    httpMock.expectNone((request) => request.url.endsWith('/api/auth/me'));
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
    sessionStorage.setItem('oauth:state', 'oauth-conflict-state');
    const error = await firstValueFrom(service.completeOAuthCallback({
      state: 'oauth-conflict-state',
      error: 'An account already uses this email.',
      code: 'OAUTH_EMAIL_CONFLICT',
    })).catch((value) => value);

    expect(error?.status).toBe(400);
    expect(error?.error?.code).toBe('OAUTH_EMAIL_CONFLICT');
    expect(error?.error?.error).toContain('already uses this email');
  });

  it('atomically consumes the OAuth mode, provider, redirect, and analytics source', () => {
    sessionStorage.setItem('oauth:mode', 'signup');
    sessionStorage.setItem('oauth:provider:github', '1');
    sessionStorage.setItem('oauth:redirect', '/javascript/coding/two-sum');
    sessionStorage.setItem('oauth:source', 'coding_submit');

    expect(service.consumeOAuthContext()).toEqual({
      mode: 'signup',
      provider: 'github',
      redirectTo: '/javascript/coding/two-sum',
      source: 'coding_submit',
    });
    expect(sessionStorage.getItem('oauth:mode')).toBeNull();
    expect(sessionStorage.getItem('oauth:provider')).toBeNull();
    expect(sessionStorage.getItem('oauth:provider:google')).toBeNull();
    expect(sessionStorage.getItem('oauth:provider:github')).toBeNull();
    expect(sessionStorage.getItem('oauth:redirect')).toBeNull();
    expect(sessionStorage.getItem('oauth:source')).toBeNull();
  });

  it('consumes and removes the legacy OAuth provider value', () => {
    sessionStorage.setItem('oauth:provider', 'google');

    expect(service.consumeOAuthContext().provider).toBe('google');
    expect(sessionStorage.getItem('oauth:provider')).toBeNull();
  });
});
