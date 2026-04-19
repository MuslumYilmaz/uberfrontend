import { TestBed } from '@angular/core/testing';
import { RestoreBannerComponent } from './restore-banner';

describe('RestoreBannerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestoreBannerComponent],
    }).compileComponents();
  });

  it('shows storage-agnostic restore copy', () => {
    const fixture = TestBed.createComponent(RestoreBannerComponent);
    fixture.componentInstance.isVisible = true;
    fixture.componentInstance.isSolution = false;
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent || '';
    expect(text).toContain('Your code was restored from saved draft.');
  });

  it('uses the configured action label for solution context', () => {
    const fixture = TestBed.createComponent(RestoreBannerComponent);
    fixture.componentInstance.isVisible = true;
    fixture.componentInstance.isSolution = true;
    fixture.componentInstance.actionLabel = 'Reset to default';
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent || '';
    expect(text).toContain('You’re viewing the solution code.');
    expect(text).toContain('Reset to default');
    expect(text).not.toContain('Revert to your code');
  });
});
