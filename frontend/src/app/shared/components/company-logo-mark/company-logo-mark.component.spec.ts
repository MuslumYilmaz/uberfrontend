import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompanyLogoMarkComponent } from './company-logo-mark.component';

describe('CompanyLogoMarkComponent', () => {
  let fixture: ComponentFixture<CompanyLogoMarkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyLogoMarkComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyLogoMarkComponent);
  });

  it('renders a local logo asset for known companies', () => {
    fixture.componentInstance.company = 'Google';
    fixture.detectChanges();

    const mark = fixture.nativeElement.querySelector('[data-testid="company-logo-mark-google"]') as HTMLElement | null;
    const image = mark?.querySelector('img') as HTMLImageElement | null;

    expect(mark?.getAttribute('aria-label')).toBe('Company logo: Google');
    expect(image?.getAttribute('src')).toBe('/assets/images/company-logos/google.svg');
    expect(image?.getAttribute('alt')).toBe('');
  });

  it('can be decorative when adjacent text already names the company', () => {
    fixture.componentInstance.company = 'amazon';
    fixture.componentInstance.decorative = true;
    fixture.detectChanges();

    const mark = fixture.nativeElement.querySelector('[data-testid="company-logo-mark-amazon"]') as HTMLElement | null;

    expect(mark?.getAttribute('aria-hidden')).toBe('true');
    expect(mark?.hasAttribute('aria-label')).toBeFalse();
  });

  it('falls back to a monogram for unknown company slugs', () => {
    fixture.componentInstance.company = 'unknown-company';
    fixture.detectChanges();

    const mark = fixture.nativeElement.querySelector('[data-testid="company-logo-mark-unknown-company"]') as HTMLElement | null;

    expect(mark?.textContent?.trim()).toBe('U');
    expect(mark?.getAttribute('aria-label')).toBe('Company logo: Unknown Company');
  });
});
