import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
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
      ['open', 'prefetch']
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
    });
    await Promise.resolve();

    const req = httpMock.expectOne(apiUrl('/billing/checkout/start'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ planId: 'monthly' });

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
      provider: 'lemonsqueezy',
      url: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly?checkout%5Bcustom_data%5D%5Bfa_checkout_attempt_id%5D=chk_123',
      attemptId: 'chk_123',
      reused: false,
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
      provider: 'lemonsqueezy',
      url: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly?checkout%5Bcustom_data%5D%5Bfa_checkout_attempt_id%5D=chk_reused_123',
      attemptId: 'chk_reused_123',
      reused: true,
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
      provider: 'lemonsqueezy',
      url: 'https://frontendatlas.lemonsqueezy.com/checkout/buy/test-monthly?checkout%5Bcustom_data%5D%5Bfa_checkout_attempt_id%5D=chk_blocked_123',
      attemptId: 'chk_blocked_123',
      reused: false,
    });
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
    });

    await expectAsync(configPromise).toBeResolvedTo({
      configuredProvider: 'lemonsqueezy',
      provider: 'lemonsqueezy',
      mode: 'test',
      enabled: true,
      plans: { monthly: true, quarterly: true, annual: false, lifetime: true },
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
    });

    await expectAsync(configPromise).toBeResolvedTo({
      configuredProvider: 'stripe',
      provider: null,
      mode: 'test',
      enabled: false,
      plans: { monthly: false, quarterly: false, annual: false, lifetime: false },
    });
  });

  it('falls back to null when checkout configuration cannot be loaded', async () => {
    const configPromise = service.getCheckoutConfig();

    const req = httpMock.expectOne(apiUrl('/billing/checkout/config'));
    req.flush(
      { code: 'CHECKOUT_CONFIG_FAILED', error: 'Failed to resolve checkout configuration' },
      { status: 500, statusText: 'Server Error' }
    );

    await expectAsync(configPromise).toBeResolvedTo(null);
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
