import { TestBed } from '@angular/core/testing';
import { CompanyOfficialGuidesComponent } from './company-official-guides.component';
import { COMPANY_OFFICIAL_GUIDES } from '../../company-previews/company-official-guides';

describe('CompanyOfficialGuidesComponent', () => {
  async function render(slug: string, companyLabel: string, guides = COMPANY_OFFICIAL_GUIDES[slug] ?? []) {
    await TestBed.configureTestingModule({ imports: [CompanyOfficialGuidesComponent] }).compileComponents();
    const fixture = TestBed.createComponent(CompanyOfficialGuidesComponent);
    fixture.componentRef.setInput('slug', slug);
    fixture.componentRef.setInput('companyLabel', companyLabel);
    fixture.componentRef.setInput('guides', guides);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders one row per official page with follow links that open safely in a new tab', async () => {
    const host = await render('amazon', 'Amazon');
    const section = host.querySelector('[data-testid="company-official-guides"]');
    expect(section?.getAttribute('aria-labelledby')).toBe('amazon-official-guides');
    expect(host.querySelector('#amazon-official-guides')?.textContent).toContain('Official preparation pages from Amazon');
    const rows = Array.from(host.querySelectorAll('tbody tr'));
    expect(rows.length).toBe(COMPANY_OFFICIAL_GUIDES['amazon'].length);
    const links = Array.from(host.querySelectorAll('tbody a')) as HTMLAnchorElement[];
    expect(links.map((link) => link.getAttribute('href'))).toEqual(COMPANY_OFFICIAL_GUIDES['amazon'].map((guide) => guide.url));
    for (const link of links) {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    }
    expect(rows[0]?.querySelector('td:last-child')?.textContent?.trim()).toBe('Oct 2026');
    expect(host.textContent).toContain('FrontendAtlas is not affiliated with Amazon');
  });

  it('renders nothing for a company without published pages', async () => {
    const host = await render('apple', 'Apple');
    expect(host.querySelector('[data-testid="company-official-guides"]')).toBeNull();
    expect(host.textContent?.trim()).toBe('');
  });
});
