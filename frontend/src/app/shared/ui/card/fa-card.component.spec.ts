import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FaCardComponent } from './fa-card.component';

@Component({
  standalone: true,
  imports: [FaCardComponent],
  template: `
    <section faCard [tabindex]="0" data-testid="focusable-card">Content</section>
    <section faCard data-testid="plain-card">Content</section>
    <a faCard disabled [tabindex]="0" href="/" data-testid="disabled-card">Content</a>
  `,
})
class TestHostComponent {}

describe('FaCardComponent tabindex contract', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('preserves an explicit integer tabindex on non-disabled cards', () => {
    const card = fixture.nativeElement.querySelector('[data-testid="focusable-card"]');
    expect(card.getAttribute('tabindex')).toBe('0');
  });

  it('does not add tabindex when the caller omitted it', () => {
    const card = fixture.nativeElement.querySelector('[data-testid="plain-card"]');
    expect(card.hasAttribute('tabindex')).toBeFalse();
  });

  it('forces disabled native interactive cards out of the tab order', () => {
    const card = fixture.nativeElement.querySelector('[data-testid="disabled-card"]');
    expect(card.getAttribute('tabindex')).toBe('-1');
  });
});
