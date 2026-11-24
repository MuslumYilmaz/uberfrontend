import { TestBed } from '@angular/core/testing';
import { PolarCheckoutService, PolarEmbedLoader } from './polar-checkout.service';

type Listener = (event: CustomEvent<any>) => void;

class FakeEmbed {
  readonly listeners = new Map<string, Listener[]>();
  closeCount = 0;
  addEventListener(type: string, listener: Listener): void {
    this.listeners.set(type, [...(this.listeners.get(type) || []), listener]);
  }
  close(): void {
    this.closeCount += 1;
  }
  emit(type: string, detail: Record<string, unknown> = {}): CustomEvent<any> {
    const event = new CustomEvent(type, { detail, cancelable: true });
    (this.listeners.get(type) || []).forEach((listener) => listener(event));
    return event;
  }
}

function successUrlFor(attemptId: string): string {
  return `${window.location.origin}/billing/success?attempt=${attemptId}`;
}

const SANDBOX_URL = 'https://sandbox.polar.sh/checkout/polar_c_abc123';

describe('PolarCheckoutService', () => {
  let service: PolarCheckoutService;
  let originalCheckoutRedirect: unknown;
  let created: Array<{ url: string; options?: { theme?: string } }>;
  let embed: FakeEmbed;

  type EmbedCreate = (url: string, options?: { theme?: 'light' | 'dark' }) => Promise<FakeEmbed>;
  function loaderFor(create: EmbedCreate): PolarEmbedLoader {
    return async () => ({ PolarEmbedCheckout: { create: create as any } });
  }

  beforeEach(() => {
    const win = window as any;
    originalCheckoutRedirect = win.__faCheckoutRedirect;
    delete win.__faCheckoutRedirect;
    created = [];
    embed = new FakeEmbed();
    TestBed.configureTestingModule({ providers: [PolarCheckoutService] });
    service = TestBed.inject(PolarCheckoutService);
    service.setEmbedLoaderForTesting(loaderFor(async (url, options) => {
      created.push({ url, options });
      return embed;
    }));
  });

  afterEach(() => {
    const win = window as any;
    if (originalCheckoutRedirect === undefined) {
      delete win.__faCheckoutRedirect;
    } else {
      win.__faCheckoutRedirect = originalCheckoutRedirect;
    }
    service.setEmbedLoaderForTesting(undefined);
  });

  it('opens a hosted checkout in the reserved window and never loads the embed', async () => {
    const redirect = jasmine.createSpy('checkoutRedirect');
    (window as any).__faCheckoutRedirect = redirect;

    const result = await service.open(SANDBOX_URL, { checkoutSurface: 'hosted_new_tab' }, { kind: 'hook' });

    expect(result).toBe('new-tab');
    expect(redirect).toHaveBeenCalledWith(SANDBOX_URL);
    expect(created).toEqual([]);
  });

  it('rejects a checkout URL that is not on a Polar host', async () => {
    const redirect = jasmine.createSpy('checkoutRedirect');
    (window as any).__faCheckoutRedirect = redirect;

    expect(await service.open('https://attacker.example/checkout/polar_c_abc', { checkoutSurface: 'hosted_new_tab' }, { kind: 'hook' })).toBe('new-tab');
    expect(await service.open('http://sandbox.polar.sh/checkout/polar_c_abc', { checkoutSurface: 'overlay', successUrl: successUrlFor('chk_1') })).toBe('failed');
    expect(redirect).not.toHaveBeenCalled();
    expect(created).toEqual([]);
  });

  it('opens the overlay, releases an unnecessary popup reservation and follows only the backend success URL', async () => {
    const redirect = jasmine.createSpy('checkoutRedirect');
    (window as any).__faCheckoutRedirect = redirect;
    const reservationClose = jasmine.createSpy('reservation.close');

    const result = await service.open(
      SANDBOX_URL,
      { checkoutSurface: 'overlay', successUrl: successUrlFor('chk_123') },
      { kind: 'window', target: { close: reservationClose } as any },
    );

    expect(result).toBe('overlay');
    expect(reservationClose).toHaveBeenCalled();
    expect(created.length).toBe(1);
    expect(created[0].url).toBe(SANDBOX_URL);
    expect(['light', 'dark']).toContain(created[0].options?.theme || '');

    const success = embed.emit('success', { successURL: 'https://attacker.example/billing/success?attempt=wrong', redirect: true });
    expect(success.defaultPrevented).toBeTrue();
    expect(redirect).toHaveBeenCalledWith(successUrlFor('chk_123'));
    expect(embed.closeCount).toBe(1);

    // a second success message changes nothing
    embed.emit('success', { successURL: 'https://attacker.example/x', redirect: true });
    expect(redirect).toHaveBeenCalledTimes(1);
  });

  it('continues in this tab when the backend success URL is missing or foreign', async () => {
    expect(await service.open(SANDBOX_URL, { checkoutSurface: 'overlay' })).toBe('same_tab');
    expect(await service.open(SANDBOX_URL, { checkoutSurface: 'overlay', successUrl: 'https://attacker.example/billing/success?attempt=chk_1' })).toBe('same_tab');
    expect(await service.open(SANDBOX_URL, { checkoutSurface: 'overlay', successUrl: `${window.location.origin}/profile?attempt=chk_1` })).toBe('same_tab');
    expect(created).toEqual([]);
  });

  it('continues in this tab when the embed module cannot load', async () => {
    service.setEmbedLoaderForTesting(async () => { throw new Error('chunk failed'); });
    const result = await service.open(SANDBOX_URL, { checkoutSurface: 'overlay', successUrl: successUrlFor('chk_9') });
    expect(result).toBe('same_tab');
  });

  it('closes a previous overlay when a new checkout starts', async () => {
    const first = new FakeEmbed();
    const second = new FakeEmbed();
    const embeds = [first, second];
    service.setEmbedLoaderForTesting(loaderFor(async () => embeds.shift() as any));

    expect(await service.open(SANDBOX_URL, { checkoutSurface: 'overlay', successUrl: successUrlFor('chk_a') })).toBe('overlay');
    expect(await service.open(SANDBOX_URL, { checkoutSurface: 'overlay', successUrl: successUrlFor('chk_b') })).toBe('overlay');
    expect(first.closeCount).toBe(1);
    expect(second.closeCount).toBe(0);

    // the stale embed's success no longer navigates
    const redirect = jasmine.createSpy('checkoutRedirect');
    (window as any).__faCheckoutRedirect = redirect;
    first.emit('success', { successURL: successUrlFor('chk_a'), redirect: true });
    expect(redirect).not.toHaveBeenCalled();
    second.emit('success', { successURL: 'https://attacker.example', redirect: true });
    expect(redirect).toHaveBeenCalledWith(successUrlFor('chk_b'));
  });

  it('forgets the overlay when the customer closes it', async () => {
    const redirect = jasmine.createSpy('checkoutRedirect');
    (window as any).__faCheckoutRedirect = redirect;
    await service.open(SANDBOX_URL, { checkoutSurface: 'overlay', successUrl: successUrlFor('chk_closed') });
    embed.emit('close');
    embed.emit('success', { successURL: successUrlFor('chk_closed'), redirect: true });
    expect(redirect).not.toHaveBeenCalled();
  });
});
