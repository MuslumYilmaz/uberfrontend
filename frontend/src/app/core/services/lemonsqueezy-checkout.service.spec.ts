import { TestBed } from '@angular/core/testing';
import { LemonSqueezyCheckoutService } from './lemonsqueezy-checkout.service';

describe('LemonSqueezyCheckoutService', () => {
  let service: LemonSqueezyCheckoutService;
  let originalLemonSqueezy: unknown;
  let originalCreateLemonSqueezy: unknown;
  let originalCheckoutRedirect: unknown;

  beforeEach(() => {
    const win = window as any;
    originalLemonSqueezy = win.LemonSqueezy;
    originalCreateLemonSqueezy = win.createLemonSqueezy;
    originalCheckoutRedirect = win.__faCheckoutRedirect;
    delete win.LemonSqueezy;
    delete win.createLemonSqueezy;
    delete win.__faCheckoutRedirect;
    TestBed.configureTestingModule({ providers: [LemonSqueezyCheckoutService] });
    service = TestBed.inject(LemonSqueezyCheckoutService);
  });

  afterEach(() => {
    const win = window as any;
    restoreOptionalGlobal(win, 'LemonSqueezy', originalLemonSqueezy);
    restoreOptionalGlobal(win, 'createLemonSqueezy', originalCreateLemonSqueezy);
    restoreOptionalGlobal(win, '__faCheckoutRedirect', originalCheckoutRedirect);
    document.querySelectorAll('script[data-fa-lemon-squeezy]').forEach((script) => script.remove());
  });

  it('keeps hosted checkout in the existing new-tab path by default', async () => {
    const redirect = jasmine.createSpy('checkoutRedirect');
    (window as any).__faCheckoutRedirect = redirect;

    const result = await service.open(
      'https://frontendatlas.lemonsqueezy.com/checkout/buy/monthly',
      { checkoutSurface: 'hosted_new_tab' },
      { kind: 'hook' },
    );

    expect(result).toBe('new-tab');
    expect(redirect).toHaveBeenCalledWith(
      'https://frontendatlas.lemonsqueezy.com/checkout/buy/monthly',
    );
    expect(document.querySelector('script[data-fa-lemon-squeezy]')).toBeNull();
  });

  it('opens a selected checkout with Lemon.js and releases an unnecessary popup reservation', async () => {
    const open = jasmine.createSpy('LemonSqueezy.Url.Open');
    const setup = jasmine.createSpy('LemonSqueezy.Setup');
    const initialize = jasmine.createSpy('createLemonSqueezy');
    const reservationClose = jasmine.createSpy('reservation.close');
    (window as any).LemonSqueezy = { Setup: setup, Url: { Open: open } };
    (window as any).createLemonSqueezy = initialize;

    const result = await service.open(
      'https://frontendatlas.lemonsqueezy.com/checkout/buy/quarterly?checkout%5Bcustom%5D%5Bfa_checkout_attempt_id%5D=chk_123',
      {
        checkoutSurface: 'overlay',
        successUrl: successUrlFor('chk_123'),
      },
      { kind: 'window', target: { close: reservationClose } as any },
    );

    expect(result).toBe('overlay');
    expect(reservationClose).toHaveBeenCalled();
    expect(initialize).toHaveBeenCalled();
    expect(setup).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      eventHandler: jasmine.any(Function),
    }));
    const openedUrl = new URL(open.calls.mostRecent().args[0]);
    expect(openedUrl.searchParams.get('embed')).toBe('1');
    expect(openedUrl.searchParams.get('checkout[custom][fa_checkout_attempt_id]')).toBe('chk_123');
  });

  it('closes the overlay and navigates to the backend success URL on Checkout.Success only once', async () => {
    let eventHandler: ((event: { event?: string; data?: unknown }) => void) | undefined;
    const close = jasmine.createSpy('LemonSqueezy.Url.Close');
    const redirect = jasmine.createSpy('checkoutRedirect');
    const serverSuccessUrl = successUrlFor('chk_success');
    (window as any).__faCheckoutRedirect = redirect;
    (window as any).LemonSqueezy = {
      Setup: ({ eventHandler: handler }: any) => { eventHandler = handler; },
      Url: { Open: jasmine.createSpy('LemonSqueezy.Url.Open'), Close: close },
    };

    const result = await service.open(
      'https://frontendatlas.lemonsqueezy.com/checkout/buy/monthly',
      { checkoutSurface: 'overlay', successUrl: serverSuccessUrl },
    );

    expect(result).toBe('overlay');
    expect(eventHandler).toBeDefined();

    eventHandler?.({ event: 'PaymentMethodUpdate.Mounted', data: { redirect_url: 'https://example.com' } });
    expect(close).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();

    eventHandler?.({
      event: 'Checkout.Success',
      data: { redirect_url: 'https://attacker.example/billing/success?attempt=wrong' },
    });
    eventHandler?.({ event: 'Checkout.Success', data: { id: 26651833 } });

    expect(close).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledOnceWith(serverSuccessUrl);
  });

  it('keeps only the latest overlay active and ignores a stale reinitialized event handler', async () => {
    const handlers: Array<(event: { event?: string }) => void> = [];
    const open = jasmine.createSpy('LemonSqueezy.Url.Open');
    const close = jasmine.createSpy('LemonSqueezy.Url.Close');
    const redirect = jasmine.createSpy('checkoutRedirect');
    (window as any).__faCheckoutRedirect = redirect;
    (window as any).LemonSqueezy = {
      Setup: ({ eventHandler }: any) => { handlers.push(eventHandler); },
      Url: { Open: open, Close: close },
    };

    await service.open(
      'https://frontendatlas.lemonsqueezy.com/checkout/buy/monthly',
      { checkoutSurface: 'overlay', successUrl: successUrlFor('chk_first') },
    );
    await service.open(
      'https://frontendatlas.lemonsqueezy.com/checkout/buy/quarterly',
      { checkoutSurface: 'overlay', successUrl: successUrlFor('chk_second') },
    );

    expect(open).toHaveBeenCalledTimes(2);
    expect(handlers.length).toBe(2);
    expect(close).toHaveBeenCalledTimes(1);

    handlers[0]({ event: 'Checkout.Success' });
    expect(redirect).not.toHaveBeenCalled();

    handlers[1]({ event: 'Checkout.Success' });
    expect(redirect).toHaveBeenCalledOnceWith(successUrlFor('chk_second'));
    expect(close).toHaveBeenCalledTimes(2);
  });

  it('lets the latest concurrent launch own Lemon.js setup after a shared script load', async () => {
    const handlers: Array<(event: { event?: string }) => void> = [];
    const open = jasmine.createSpy('LemonSqueezy.Url.Open');

    const first = service.open(
      'https://frontendatlas.lemonsqueezy.com/checkout/buy/monthly',
      { checkoutSurface: 'overlay', successUrl: successUrlFor('chk_race_first') },
    );
    const second = service.open(
      'https://frontendatlas.lemonsqueezy.com/checkout/buy/annual',
      { checkoutSurface: 'overlay', successUrl: successUrlFor('chk_race_second') },
    );

    const script = document.querySelector<HTMLScriptElement>('script[data-fa-lemon-squeezy]');
    expect(script).not.toBeNull();
    (window as any).LemonSqueezy = {
      Setup: ({ eventHandler }: any) => { handlers.push(eventHandler); },
      Url: { Open: open, Close: jasmine.createSpy('LemonSqueezy.Url.Close') },
    };
    script?.dispatchEvent(new Event('load'));

    await expectAsync(first).toBeResolvedTo('failed');
    await expectAsync(second).toBeResolvedTo('overlay');
    expect(open).toHaveBeenCalledTimes(1);
    expect(open.calls.mostRecent().args[0]).toContain('/checkout/buy/annual');
    expect(handlers.length).toBe(1);
  });

  it('returns a same-tab handoff without navigating before client-state and analytics are recorded', async () => {
    const redirect = jasmine.createSpy('checkoutRedirect');
    (window as any).__faCheckoutRedirect = redirect;
    (window as any).LemonSqueezy = {
      Setup: () => undefined,
      Url: { Open: () => { throw new Error('overlay blocked'); } },
    };
    spyOn(console, 'warn');

    const url = 'https://frontendatlas.lemonsqueezy.com/checkout/buy/annual?checkout%5Bemail%5D=user%40example.com';
    const result = await service.open(url, {
      checkoutSurface: 'overlay',
      successUrl: successUrlFor('chk_fallback'),
    });

    expect(result).toBe('same_tab');
    expect(redirect).not.toHaveBeenCalled();
  });

  it('reports a failed v2 launch for an untrusted provider URL', async () => {
    spyOn(console, 'error');

    const result = await service.open(
      'https://attacker.example/checkout/buy/lifetime',
      {
        checkoutSurface: 'overlay',
        successUrl: successUrlFor('chk_failed'),
      },
    );

    expect(result).toBe('failed');
  });

  it('uses hosted same-tab checkout when the backend success URL is missing or unsafe', async () => {
    const open = jasmine.createSpy('LemonSqueezy.Url.Open');
    const setup = jasmine.createSpy('LemonSqueezy.Setup');
    const redirect = jasmine.createSpy('checkoutRedirect');
    (window as any).__faCheckoutRedirect = redirect;
    (window as any).LemonSqueezy = { Setup: setup, Url: { Open: open } };
    spyOn(console, 'warn');

    const checkoutUrl = 'https://frontendatlas.lemonsqueezy.com/checkout/buy/monthly';
    const result = await service.open(checkoutUrl, {
      checkoutSurface: 'overlay',
      successUrl: 'https://attacker.example/billing/success?attempt=wrong',
    });

    expect(result).toBe('same_tab');
    expect(redirect).not.toHaveBeenCalled();
    expect(setup).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });
});

function successUrlFor(attemptId: string): string {
  return `${window.location.origin}/billing/success?attempt=${encodeURIComponent(attemptId)}`;
}

function restoreOptionalGlobal(target: Record<string, unknown>, key: string, value: unknown): void {
  if (value === undefined) {
    delete target[key];
    return;
  }
  target[key] = value;
}
