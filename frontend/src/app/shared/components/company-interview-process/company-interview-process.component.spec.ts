import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CompanyInterviewProcessComponent } from './company-interview-process.component';
import type { CompanyInterviewProcess } from '../../company-previews/company-interview-processes';

const FIXTURE: CompanyInterviewProcess = {
  summary: 'An assessment, a screen and a final loop.',
  caveat: 'Loops differ by team and level.',
  checkedAt: '2026-10-20',
  variants: [
    {
      title: 'Experienced hires',
      note: 'Two reports describe the same order.',
      stages: [
        {
          stage: 'Online assessment',
          format: 'Coding in a browser IDE.',
          appliesTo: 'All levels',
          sources: [{ label: 'Acme hiring guide', url: 'https://jobs.acme.example/guide', kind: 'official', date: '2026-10' }],
          practice: { label: 'Debounce', path: '/javascript/coding/js-debounce' },
        },
        {
          stage: 'System design',
          format: 'A frontend design round.',
          appliesTo: 'Senior roles',
          sources: [
            { label: 'Taro, Sunnyvale', url: 'https://reports.example/one', kind: 'report', date: '2023-04' },
            { label: 'Blind, US', url: 'https://reports.example/two', kind: 'report', date: '2025-01' },
          ],
        },
      ],
    },
    {
      title: 'Internships',
      stages: [
        {
          stage: 'Technical round',
          format: 'React fundamentals.',
          appliesTo: 'Interns',
          sources: [{ label: 'Taro, Fremont', url: 'https://reports.example/three', kind: 'report', date: '2025-03' }],
        },
      ],
    },
  ],
};

describe('CompanyInterviewProcessComponent', () => {
  async function render(process: CompanyInterviewProcess | null) {
    await TestBed.configureTestingModule({
      imports: [CompanyInterviewProcessComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(CompanyInterviewProcessComponent);
    fixture.componentRef.setInput('slug', 'acme');
    fixture.componentRef.setInput('companyLabel', 'Acme');
    fixture.componentRef.setInput('process', process);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders one labelled table per variant with a row per stage', async () => {
    const host = await render(FIXTURE);
    const section = host.querySelector('[data-testid="company-interview-process"]');
    expect(section?.getAttribute('aria-labelledby')).toBe('acme-interview-process');
    expect(host.querySelector('#acme-interview-process')?.textContent?.trim()).toBe('Acme frontend interview process');
    expect(host.textContent).toContain('Sources last checked Oct 2026.');

    const tables = Array.from(host.querySelectorAll('table'));
    expect(tables.map((table) => table.getAttribute('aria-labelledby'))).toEqual([
      'acme-interview-process-1',
      'acme-interview-process-2',
    ]);
    expect(host.querySelector('#acme-interview-process-1')?.textContent?.trim()).toBe('Experienced hires');
    expect(tables.map((table) => table.querySelectorAll('tbody tr').length)).toEqual([2, 1]);
    expect(tables[0].querySelector('tbody th[scope="row"]')?.textContent?.trim()).toBe('Online assessment');
  });

  it('labels evidence strength and keeps report links nofollow while official pages stay followed', async () => {
    const host = await render(FIXTURE);
    const strengths = Array.from(host.querySelectorAll('.interview-process__strength')).map((node) => node.textContent?.trim());
    expect(strengths).toEqual(['Official page', '2 public reports, 2023–2025', 'One public report, 2025']);

    const official = host.querySelector('a[href="https://jobs.acme.example/guide"]');
    expect(official?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(official?.getAttribute('target')).toBe('_blank');
    const report = host.querySelector('a[href="https://reports.example/one"]');
    expect(report?.getAttribute('rel')).toBe('noopener noreferrer nofollow');
    expect(report?.parentElement?.textContent).toContain('Apr 2023');
  });

  it('links the matching practice page through the router', async () => {
    const host = await render(FIXTURE);
    const practice = host.querySelector('.interview-process__practice a');
    expect(practice?.getAttribute('href')).toBe('/javascript/coding/js-debounce');
    expect(practice?.textContent?.trim()).toBe('Debounce');
  });

  it('uses the title override when the company names the role', async () => {
    const host = await render({ ...FIXTURE, title: 'Acme Front End Engineer interview process' });
    expect(host.querySelector('#acme-interview-process')?.textContent?.trim()).toBe('Acme Front End Engineer interview process');
  });

  it('renders nothing for a company without a process entry', async () => {
    const host = await render(null);
    expect(host.querySelector('[data-testid="company-interview-process"]')).toBeNull();
    expect(host.textContent?.trim()).toBe('');
  });
});
