import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { CompanyGuideViewer } from '../company-question-list/company-question-list.component';
import { CompanyGuideSourcesComponent, type GuideSourceRow } from './company-guide-sources.component';

const ROWS: GuideSourceRow[] = [
  { label: 'Taro account, March 2026', url: 'https://reports.example/one', kind: 'report', note: 'One loop.', who: 'Frontend engineer, United States', date: '2026-03' },
  { label: 'Acme careers', url: 'https://acme.example/careers', kind: 'official', note: 'Context only.', who: null, date: null },
];

describe('CompanyGuideSourcesComponent', () => {
  let fixture: ComponentFixture<CompanyGuideSourcesComponent>;

  function create(viewer: CompanyGuideViewer): HTMLElement {
    TestBed.configureTestingModule({ imports: [CompanyGuideSourcesComponent], providers: [provideRouter([])] });
    fixture = TestBed.createComponent(CompanyGuideSourcesComponent);
    fixture.componentRef.setInput('slug', 'acme');
    fixture.componentRef.setInput('sources', ROWS);
    fixture.componentRef.setInput('viewer', viewer);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('names every source with who and when for a visitor, closed and without links', () => {
    const host = create('guest');
    expect(host.querySelector('details')?.hasAttribute('open')).toBeFalse();
    expect(host.querySelector('h2')?.textContent?.trim()).toBe('Sources (2)');
    expect(host.querySelectorAll('a[href^="http"]').length).toBe(0);
    expect(host.textContent).toContain('Frontend engineer, United States · Mar 2026');
    expect(host.querySelector('[data-testid="company-guide-sources-gate"] a')?.getAttribute('href')).toBe('/auth/signup?redirectTo=%2Fcompanies%2Facme%2Fpreview');
  });

  it('links the sources for an account, reports with nofollow', () => {
    const host = create('account');
    const links = Array.from(host.querySelectorAll<HTMLAnchorElement>('a[href^="http"]')).map((a) => [a.getAttribute('href'), a.getAttribute('rel')]);
    expect(links).toEqual([
      ['https://reports.example/one', 'noopener noreferrer nofollow'],
      ['https://acme.example/careers', 'noopener noreferrer'],
    ]);
    expect(host.querySelector('[data-testid="company-guide-sources-gate"]')).toBeNull();
  });
});
