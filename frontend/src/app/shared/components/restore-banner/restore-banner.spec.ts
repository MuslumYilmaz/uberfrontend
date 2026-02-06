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
});
