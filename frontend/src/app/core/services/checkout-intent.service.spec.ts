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
      campaignId: 'INTERVIEW_AUGUST',
      returnUrl: '/?view=plans',
    });

    expect(service.load()).toEqual(jasmine.objectContaining({
      version: 1,
      planId: 'quarterly',
      src: 'showcase_pricing',
      surface: 'showcase_pricing',
      campaignId: 'interview_august',
      returnUrl: '/?view=plans',
    }));
  });

  it('drops unsafe campaign values and never persists raw discount-code fields', () => {
    const intent = service.save({
      planId: 'monthly',
      src: 'pricing',
      surface: 'pricing_page',
      campaignId: 'SAVE 15% NOW',
      returnUrl: '/pricing',
      ...({ couponCode: 'ATLAS15', discountCode: 'SAVE15' } as any),
    });

    const stored = sessionStorage.getItem('fa:checkout:intent:v1') || '';
    expect(intent.campaignId).toBeUndefined();
    expect(stored).not.toContain('ATLAS15');
    expect(stored).not.toContain('SAVE15');
    expect(stored).not.toContain('couponCode');
    expect(stored).not.toContain('discountCode');
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
