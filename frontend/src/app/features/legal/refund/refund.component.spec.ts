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
      'By limited usage, we mean the paid library has not been substantially consumed. ' +
        'We assess this case by case based on request timing and available account records.',
    );
    expect(copy).toContain('This policy does not limit mandatory consumer rights');
    expect(copy).toContain('Effective date: 2025-12-31');
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
