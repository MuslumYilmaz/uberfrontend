import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefundComponent } from './refund.component';

describe('RefundComponent', () => {
  let fixture: ComponentFixture<RefundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefundComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RefundComponent);
    fixture.detectChanges();
  });

  it('publishes a complete refund request process without template placeholders', () => {
    const element = fixture.nativeElement as HTMLElement;
    const copy = element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    const supportLink = element.querySelector<HTMLAnchorElement>(
      'a[href="mailto:support@frontendatlas.com"]',
    );

    expect(copy).toContain('Refund requests: support@frontendatlas.com');
    expect(copy).toContain(
      'Your first Premium purchase on any plan (monthly, quarterly, annual, or lifetime) can be refunded in full ' +
        'if you ask within 14 days of the order. You do not need to give a reason, and how much of the library you ' +
        'used does not matter.',
    );
    expect(copy).toContain('One first-purchase refund per person and per account');
    expect(copy).toContain('Later purchases and renewals follow Section 4');
    expect(copy).toContain('Lemon Squeezy, our payment provider, emails a renewal reminder seven days before the renewal date.');
    expect(copy).toContain('Renewal charges are generally non-refundable.');
    expect(copy).not.toContain('limited usage');
    expect(copy).toContain('This policy does not limit mandatory consumer rights');
    expect(copy).toContain('Effective date: 2026-10-15');
    expect(supportLink).toBeTruthy();

    for (const forbidden of [
      'Add a',
      'TODO',
      'TBD',
      '[insert',
      'placeholder',
      'your company',
      'your jurisdiction',
    ]) {
      expect(copy.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });
});
