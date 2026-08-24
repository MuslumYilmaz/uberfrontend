import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { apiUrl } from '../utils/api-base';
import { BillingCheckoutService } from './billing-checkout.service';
import { GumroadOverlayService } from './gumroad-overlay.service';
import { LemonSqueezyCheckoutService } from './lemonsqueezy-checkout.service';

describe('BillingCheckoutService', () => {
  let service: BillingCheckoutService;
  let httpMock: HttpTestingController;
  let lemonSqueezyCheckout: jasmine.SpyObj<LemonSqueezyCheckoutService>;

  beforeEach(() => {
    lemonSqueezyCheckout = jasmine.createSpyObj<LemonSqueezyCheckoutService>(
      'LemonSqueezyCheckoutService',
      ['open', 'prefetch', 'reserve', 'release']
    );
    lemonSqueezyCheckout.open.and.resolveTo('new-tab');
    lemonSqueezyCheckout.prefetch.and.resolveTo();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        BillingCheckoutService,
        { provide: GumroadOverlayService, useValue: jasmine.createSpyObj('GumroadOverlayService', ['open', 'prefetch']) },
        { provide: LemonSqueezyCheckoutService, useValue: lemonSqueezyCheckout },
      ],
    });

    service = TestBed.inject(BillingCheckoutService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('starts checkout on the backend and opens the returned hosted url', async () => {
    const configPromise = service.getCheckoutConfig();
    const configReq = httpMock.expectOne(apiUrl('/billing/checkout/config'));
    configReq.flush({
      configuredProvider: 'lemonsqueezy',
      provider: 'lemonsqueezy',
      mode: 'test',
      enabled: true,
      plans: { monthly: true, quarterly: true, annual: true, lifetime: true },
    });
    await configPromise;

    const checkoutPromise = service.checkout('monthly', {
      userId: 'user_1',
      email: 'billing@example.com',
      username: 'billing_user',
      campaignId: 'ATLAS 15',
    }, 'pricing_page');
    await Promise.resolve();

    const req = httpMock.expectOne(apiUrl('/billing/checkout/start'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      planId: 'monthly',
      analyticsSource: 'pricing_page',
      analyticsSurface: 'pricing_page',
      offerVersion: 'pricing_baseline_v1',
      checkoutSurface: 'hosted_new_tab',
    });

    req.flush({
      attemptId: 'chk_123',
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      checkoutUrl: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly?checkout%5Bcustom_data%5D%5Bfa_checkout_attempt_id%5D=chk_123',
      successUrl: 'http://localhost:4200/billing/success?attempt=chk_123',
      cancelUrl: 'http://localhost:4200/billing/cancel?attempt=chk_123',
    });

    const result = await checkoutPromise;
    expect(result).toEqual({
      ok: true,
      mode: 'new-tab',
      checkoutMode: 'test',
      provider: 'lemonsqueezy',
      url: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly?checkout%5Bcustom_data%5D%5Bfa_checkout_attempt_id%5D=chk_123',
      attemptId: 'chk_123',
      reused: false,
      offerVersion: 'pricing_baseline_v1',
      checkoutSurface: 'hosted_new_tab',
    });
    expect(lemonSqueezyCheckout.open).toHaveBeenCalled();
  });

  it('preserves backend reuse metadata when an active checkout attempt is reopened', async () => {
    const configPromise = service.getCheckoutConfig();
    httpMock.expectOne(apiUrl('/billing/checkout/config')).flush({
      configuredProvider: 'lemonsqueezy',
      provider: 'lemonsqueezy',
      mode: 'test',
      enabled: true,
      plans: { monthly: true, quarterly: true, annual: true, lifetime: true },
    });
    await configPromise;

    const checkoutPromise = service.checkout('monthly');
    await Promise.resolve();

    const req = httpMock.expectOne(apiUrl('/billing/checkout/start'));
    req.flush({
      attemptId: 'chk_reused_123',
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      checkoutUrl: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly?checkout%5Bcustom_data%5D%5Bfa_checkout_attempt_id%5D=chk_reused_123',
      successUrl: 'http://localhost:4200/billing/success?attempt=chk_reused_123',
      cancelUrl: 'http://localhost:4200/billing/cancel?attempt=chk_reused_123',
      reused: true,
    });

    await expectAsync(checkoutPromise).toBeResolvedTo({
      ok: true,
      mode: 'new-tab',
      checkoutMode: 'test',
      provider: 'lemonsqueezy',
      url: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly?checkout%5Bcustom_data%5D%5Bfa_checkout_attempt_id%5D=chk_reused_123',
      attemptId: 'chk_reused_123',
      reused: true,
      offerVersion: 'pricing_baseline_v1',
      checkoutSurface: 'hosted_new_tab',
    });
  });

  it('preserves a blocked checkout launch result from the provider opener', async () => {
    const configPromise = service.getCheckoutConfig();
    httpMock.expectOne(apiUrl('/billing/checkout/config')).flush({
      configuredProvider: 'lemonsqueezy',
      provider: 'lemonsqueezy',
      mode: 'test',
      enabled: true,
      plans: { monthly: true, quarterly: true, annual: true, lifetime: true },
    });
    await configPromise;

    lemonSqueezyCheckout.open.and.resolveTo('blocked');

    const checkoutPromise = service.checkout('monthly');
    await Promise.resolve();

    const req = httpMock.expectOne(apiUrl('/billing/checkout/start'));
    req.flush({
      attemptId: 'chk_blocked_123',
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      checkoutUrl: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly?checkout%5Bcustom_data%5D%5Bfa_checkout_attempt_id%5D=chk_blocked_123',
      successUrl: 'http://localhost:4200/billing/success?attempt=chk_blocked_123',
      cancelUrl: 'http://localhost:4200/billing/cancel?attempt=chk_blocked_123',
    });

    await expectAsync(checkoutPromise).toBeResolvedTo({
      ok: true,
      mode: 'blocked',
      checkoutMode: 'test',
      provider: 'lemonsqueezy',
      url: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly?checkout%5Bcustom_data%5D%5Bfa_checkout_attempt_id%5D=chk_blocked_123',
      attemptId: 'chk_blocked_123',
      reused: false,
      offerVersion: 'pricing_baseline_v1',
      checkoutSurface: 'hosted_new_tab',
    });
  });

  it('launches the server-selected v2 overlay without reserving a popup and preserves attribution', async () => {
    const configPromise = service.getCheckoutConfig();
    httpMock.expectOne(apiUrl('/billing/checkout/config')).flush({
      configuredProvider: 'lemonsqueezy',
      provider: 'lemonsqueezy',
      mode: 'live',
      enabled: true,
      plans: { monthly: true, quarterly: true, annual: true, lifetime: true },
      planDetails: {},
      offerVersion: 'interview_sprint_v2',
      checkoutSurface: 'overlay',
    });
    await configPromise;
    expect(service.reserveCheckoutWindow()).toBeNull();
    expect(lemonSqueezyCheckout.reserve).not.toHaveBeenCalled();

    lemonSqueezyCheckout.open.and.resolveTo('overlay');
    const checkoutPromise = service.checkout('quarterly', {
      analyticsSessionId: 'ga-session.123',
      experimentId: 'checkout_overlay_v1',
      campaignId: 'INTERVIEW_AUGUST',
      offerVersion: 'interview_sprint_v2',
      checkoutSurface: 'overlay',
    }, 'pricing_page', 'pricing_cards');
    await Promise.resolve();

    const req = httpMock.expectOne(apiUrl('/billing/checkout/start'));
    expect(req.request.body).toEqual({
      planId: 'quarterly',
      analyticsSource: 'pricing_page',
      analyticsSurface: 'pricing_cards',
      analyticsSessionId: 'ga-session.123',
      experimentId: 'checkout_overlay_v1',
      campaignId: 'interview_august',
      offerVersion: 'interview_sprint_v2',
      checkoutSurface: 'overlay',
    });
    const url = 'https://frontendatlas.lemonsqueezy.com/checkout/buy/v2-quarterly';
    req.flush({
      attemptId: 'chk_overlay_123',
      provider: 'lemonsqueezy',
      planId: 'quarterly',
      mode: 'live',
      checkoutUrl: url,
      successUrl: 'https://frontendatlas.com/billing/success?attempt=chk_overlay_123',
      cancelUrl: 'https://frontendatlas.com/billing/cancel?attempt=chk_overlay_123',
      campaignId: 'interview_august',
      providerDiscountId: 'ls_discount_internal_123',
      offerVersion: 'interview_sprint_v2',
      checkoutSurface: 'overlay',
    });

    await expectAsync(checkoutPromise).toBeResolvedTo({
      ok: true,
      mode: 'overlay',
      checkoutMode: 'live',
      provider: 'lemonsqueezy',
      url,
      attemptId: 'chk_overlay_123',
      reused: false,
      campaignId: 'interview_august',
      offerVersion: 'interview_sprint_v2',
      checkoutSurface: 'overlay',
    });
    expect(lemonSqueezyCheckout.open).toHaveBeenCalledWith(
      url,
      jasmine.objectContaining({
        checkoutSurface: 'overlay',
        successUrl: 'https://frontendatlas.com/billing/success?attempt=chk_overlay_123',
      }),
      undefined,
    );
  });

  it('maps the v2 opener same-tab fallback into the additive public launch mode', async () => {
    const configPromise = service.getCheckoutConfig();
    httpMock.expectOne(apiUrl('/billing/checkout/config')).flush({
      configuredProvider: 'lemonsqueezy',
      provider: 'lemonsqueezy',
      mode: 'test',
      enabled: true,
      plans: { monthly: true, quarterly: true, annual: true, lifetime: true },
      planDetails: {},
      offerVersion: 'interview_sprint_v2',
      checkoutSurface: 'overlay',
    });
    await configPromise;
    lemonSqueezyCheckout.open.and.resolveTo('same_tab');

    const checkoutPromise = service.checkout('monthly');
    await Promise.resolve();
    httpMock.expectOne(apiUrl('/billing/checkout/start')).flush({
      attemptId: 'chk_same_tab',
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      checkoutUrl: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/v2-monthly',
      successUrl: 'http://localhost:4200/billing/success?attempt=chk_same_tab',
      cancelUrl: 'http://localhost:4200/billing/cancel?attempt=chk_same_tab',
      offerVersion: 'interview_sprint_v2',
      checkoutSurface: 'overlay',
    });

    const result = await checkoutPromise;
    expect(result.ok).toBeTrue();
    if (result.ok) expect(result.mode).toBe('same-tab');
  });

  it('rejects a checkout path returned on an untrusted or insecure host', async () => {
    spyOn(console, 'error');
    const configPromise = service.getCheckoutConfig();
    httpMock.expectOne(apiUrl('/billing/checkout/config')).flush({
      configuredProvider: 'lemonsqueezy',
      provider: 'lemonsqueezy',
      mode: 'live',
      enabled: true,
      plans: { monthly: true, quarterly: true, annual: true, lifetime: true },
    });
    await configPromise;

    const checkoutPromise = service.checkout('monthly');
    await Promise.resolve();
    httpMock.expectOne(apiUrl('/billing/checkout/start')).flush({
      attemptId: 'chk_hostile',
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'live',
      checkoutUrl: 'https://example.com/checkout/buy/lookalike',
      successUrl: 'https://frontendatlas.com/billing/success?attempt=chk_hostile',
      cancelUrl: 'https://frontendatlas.com/billing/cancel?attempt=chk_hostile',
    });

    await expectAsync(checkoutPromise).toBeResolvedTo({
      ok: false,
      reason: 'invalid-url',
      provider: 'lemonsqueezy',
    });
    expect(lemonSqueezyCheckout.open).not.toHaveBeenCalled();
  });

  it('maps backend availability failures to a missing-url result', async () => {
    const configPromise = service.getCheckoutConfig();
    httpMock.expectOne(apiUrl('/billing/checkout/config')).flush({
      configuredProvider: 'lemonsqueezy',
      provider: 'lemonsqueezy',
      mode: 'test',
      enabled: true,
      plans: { monthly: true, quarterly: true, annual: true, lifetime: true },
    });
    await configPromise;

    const checkoutPromise = service.checkout('monthly');
    await Promise.resolve();

    const req = httpMock.expectOne(apiUrl('/billing/checkout/start'));
    req.flush(
      { code: 'CHECKOUT_UNAVAILABLE', error: 'Checkout unavailable' },
      { status: 409, statusText: 'Conflict' }
    );

    await expectAsync(checkoutPromise).toBeResolvedTo({
      ok: false,
      reason: 'missing-url',
      provider: 'lemonsqueezy',
    });
    expect(lemonSqueezyCheckout.open).not.toHaveBeenCalled();
  });

  it('maps Gumroad email verification gating without opening checkout', async () => {
    const configPromise = service.getCheckoutConfig();
    httpMock.expectOne(apiUrl('/billing/checkout/config')).flush({
      configuredProvider: 'gumroad',
      provider: 'gumroad',
      mode: 'live',
      enabled: true,
      plans: { monthly: true, quarterly: true, annual: true, lifetime: false },
    });
    await configPromise;

    const checkoutPromise = service.checkout('monthly');
    await Promise.resolve();

    httpMock.expectOne(apiUrl('/billing/checkout/start')).flush(
      { code: 'EMAIL_VERIFICATION_REQUIRED', error: 'Verify your email before starting a Gumroad checkout' },
      { status: 409, statusText: 'Conflict' },
    );

    await expectAsync(checkoutPromise).toBeResolvedTo({
      ok: false,
      reason: 'verification-required',
      provider: 'gumroad',
    });
  });

  it('loads checkout configuration from the backend', async () => {
    const configPromise = service.getCheckoutConfig();

    const req = httpMock.expectOne(apiUrl('/billing/checkout/config'));
    expect(req.request.method).toBe('GET');
    req.flush({
      configuredProvider: 'lemonsqueezy',
      provider: 'lemonsqueezy',
      mode: 'test',
      enabled: true,
      plans: { monthly: true, quarterly: true, annual: false, lifetime: true },
      planDetails: {
        monthly: {
          amountCents: 1200,
          currency: 'usd',
          interval: 'month',
          intervalCount: 1,
          taxInclusive: true,
        },
        lifetime: {
          amountCents: 19900,
          currency: 'USD',
          interval: 'one_time',
          intervalCount: null,
          taxInclusive: true,
        },
      },
      offerVersion: 'interview_sprint_v2',
      checkoutSurface: 'overlay',
    });

    await expectAsync(configPromise).toBeResolvedTo({
      configuredProvider: 'lemonsqueezy',
      provider: 'lemonsqueezy',
      mode: 'test',
      enabled: true,
      plans: { monthly: true, quarterly: true, annual: false, lifetime: true },
      planDetails: {
        monthly: {
          amountCents: 1200,
          currency: 'USD',
          interval: 'month',
          intervalCount: 1,
          taxInclusive: true,
        },
        lifetime: {
          amountCents: 19900,
          currency: 'USD',
          interval: 'one_time',
          intervalCount: null,
          taxInclusive: true,
        },
      },
      offerVersion: 'interview_sprint_v2',
      checkoutSurface: 'overlay',
    });
  });

  it('preserves a reserved configured provider while exposing no runtime checkout provider', async () => {
    const configPromise = service.getCheckoutConfig();

    const req = httpMock.expectOne(apiUrl('/billing/checkout/config'));
    req.flush({
      configuredProvider: 'stripe',
      provider: null,
      mode: 'test',
      enabled: false,
      plans: { monthly: false, quarterly: false, annual: false, lifetime: false },
      planDetails: {},
      offerVersion: 'pricing_baseline_v1',
      checkoutSurface: 'hosted_new_tab',
    });

    await expectAsync(configPromise).toBeResolvedTo({
      configuredProvider: 'stripe',
      provider: null,
      mode: 'test',
      enabled: false,
      plans: { monthly: false, quarterly: false, annual: false, lifetime: false },
      planDetails: {},
      offerVersion: 'pricing_baseline_v1',
      checkoutSurface: 'hosted_new_tab',
    });
  });

  it('falls back to null when checkout configuration cannot be loaded', async () => {
    const configPromise = service.getCheckoutConfig();

    const req = httpMock.expectOne(apiUrl('/billing/checkout/config'));
    req.flush(
      { code: 'CHECKOUT_CONFIG_FAILED', error: 'Failed to resolve checkout configuration' },
      { status: 400, statusText: 'Bad Request' }
    );

    await expectAsync(configPromise).toBeResolvedTo(null);
  });

  it('retries transient config failures and caches only the successful result', fakeAsync(() => {
    let resolved: unknown;
    service.getCheckoutConfig().then((value) => { resolved = value; });

    httpMock.expectOne(apiUrl('/billing/checkout/config')).flush(
      { code: 'TEMPORARY' },
      { status: 503, statusText: 'Unavailable' },
    );
    flushMicrotasks();
    expect(resolved).toBeUndefined();

    tick(500);
    httpMock.expectOne(apiUrl('/billing/checkout/config')).flush(
      { code: 'TEMPORARY' },
      { status: 503, statusText: 'Unavailable' },
    );
    flushMicrotasks();

    tick(1500);
    httpMock.expectOne(apiUrl('/billing/checkout/config')).flush({
      configuredProvider: 'lemonsqueezy',
      provider: 'lemonsqueezy',
      mode: 'live',
      enabled: true,
      plans: { monthly: true, quarterly: true, annual: true, lifetime: true },
    });
    flushMicrotasks();

    expect(resolved).toEqual(jasmine.objectContaining({ mode: 'live', enabled: true }));
  }));

  it('records checkout client state without exposing the checkout url', () => {
    service.recordAttemptClientState('chk_state_123', 'popup_blocked').subscribe((attempt) => {
      expect(attempt.attemptId).toBe('chk_state_123');
    });

    const req = httpMock.expectOne(apiUrl('/billing/checkout/attempts/chk_state_123/client-state'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ state: 'popup_blocked' });
    req.flush({ attemptId: 'chk_state_123' });
  });

  it('fetches checkout attempt status from the backend', (done) => {
    service.fetchAttemptStatus('chk_status_123').subscribe((result) => {
      expect(result).toEqual({
        attempt: {
          attemptId: 'chk_status_123',
          provider: 'lemonsqueezy',
          planId: 'monthly',
          mode: 'test',
          state: 'awaiting_webhook',
          rawStatus: 'created',
          entitlementActive: false,
          accessTierEffective: 'free',
          billingEventId: null,
          lastErrorCode: null,
          lastErrorMessage: null,
          purchase: null,
        },
        status: 200,
      });
      done();
    });

    const req = httpMock.expectOne(apiUrl('/billing/checkout/attempts/chk_status_123/status'));
    expect(req.request.method).toBe('GET');
    req.flush({
      attemptId: 'chk_status_123',
      provider: 'lemonsqueezy',
      planId: 'monthly',
      mode: 'test',
      state: 'awaiting_webhook',
      rawStatus: 'created',
      entitlementActive: false,
      accessTierEffective: 'free',
      billingEventId: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      purchase: null,
    });
  });

  it('maps checkout attempt status http errors to a structured result', (done) => {
    service.fetchAttemptStatus('chk_missing').subscribe((result) => {
      expect(result).toEqual({
        attempt: null,
        status: 404,
        code: 'CHECKOUT_ATTEMPT_NOT_FOUND',
      });
      done();
    });

    const req = httpMock.expectOne(apiUrl('/billing/checkout/attempts/chk_missing/status'));
    req.flush(
      { code: 'CHECKOUT_ATTEMPT_NOT_FOUND', error: 'Checkout attempt not found' },
      { status: 404, statusText: 'Not Found' }
    );
  });
});
