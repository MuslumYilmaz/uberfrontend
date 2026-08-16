import { TestBed } from '@angular/core/testing';
import { CheckoutIntentService } from './checkout-intent.service';

describe('CheckoutIntentService', () => {
  let service: CheckoutIntentService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CheckoutIntentService] });
    service = TestBed.inject(CheckoutIntentService);
    sessionStorage.removeItem('fa:checkout:intent:v1');
  });

  afterEach(() => sessionStorage.removeItem('fa:checkout:intent:v1'));

  it('round-trips a controlled, session-scoped checkout intent', () => {
    service.save({
      planId: 'quarterly',
      src: 'showcase_pricing',
      surface: 'showcase_pricing',
      returnUrl: '/?view=plans',
    });

    expect(service.load()).toEqual(jasmine.objectContaining({
      version: 1,
      planId: 'quarterly',
      src: 'showcase_pricing',
      surface: 'showcase_pricing',
      returnUrl: '/?view=plans',
    }));
  });

  it('rejects stale or unsafe stored values', () => {
    sessionStorage.setItem('fa:checkout:intent:v1', JSON.stringify({
      version: 1,
      planId: 'quarterly',
      src: 'pricing',
      surface: 'pricing_page',
      returnUrl: 'https://attacker.example/continue',
      createdAt: Date.now() - (31 * 60 * 1000),
    }));

    expect(service.load()).toBeNull();
    expect(sessionStorage.getItem('fa:checkout:intent:v1')).toBeNull();
  });
});
