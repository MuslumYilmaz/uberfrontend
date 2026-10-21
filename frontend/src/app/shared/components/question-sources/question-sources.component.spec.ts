import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { QuestionSource } from '../../../core/models/question.model';
import { QuestionSourcesComponent, QuestionSourcesVariant } from './question-sources.component';

@Component({
  imports: [QuestionSourcesComponent],
  template: `<app-question-sources [sources]="sources" [variant]="variant"></app-question-sources>`,
})
class HostComponent {
  sources: QuestionSource[] | null | undefined = [];
  variant: QuestionSourcesVariant = 'full';
}

describe('QuestionSourcesComponent', () => {
  const sources: QuestionSource[] = [
    {
      label: 'PracHub: Waymo senior frontend interview experience, May 2026',
      url: 'https://prachub.com/interview-experiences/waymo-senior-frontend-engineer',
      publisher: 'PracHub',
      date: '2026-05',
      note: 'One self-reported senior loop. It establishes the round list, not the wording.',
    },
    {
      label: 'Glassdoor: Waymo frontend intern interview',
      url: 'https://www.glassdoor.com/Interview/Waymo-Interview-Questions-E1234.htm',
      publisher: 'Glassdoor',
      date: '2025-08-12',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent], providers: [provideRouter([])] }).compileComponents();
  });

  function render(value: QuestionSource[] | null | undefined, variant: QuestionSourcesVariant = 'full') {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.sources = value;
    fixture.componentInstance.variant = variant;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the heading, provenance sentence, links and notes in the full variant', () => {
    const host = render(sources);
    const block = host.querySelector('[data-testid="question-sources"]') as HTMLElement;
    expect(block).not.toBeNull();
    expect(block.querySelector('h3')?.textContent?.trim()).toBe('Public interview reports');
    expect(block.textContent).toContain('not verified official questions or endorsements');
    const links = Array.from(block.querySelectorAll('a'));
    expect(links.map((link) => link.getAttribute('href'))).toEqual(sources.map((source) => source.url));
    for (const link of links) {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer nofollow');
    }
    expect(block.textContent).toContain('PracHub, May 2026');
    expect(block.textContent).toContain('Glassdoor, August 12, 2025');
    expect(block.textContent).toContain('It establishes the round list, not the wording.');
    expect(host.querySelector('[data-testid="question-sources-compact"]')).toBeNull();
  });

  it('renders one line of publisher and date links in the compact variant', () => {
    const host = render(sources, 'compact');
    const line = host.querySelector('[data-testid="question-sources-compact"]') as HTMLElement;
    expect(line).not.toBeNull();
    expect(line.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Public interview reports: PracHub (May 2026), Glassdoor (August 12, 2025)',
    );
    expect(line.querySelectorAll('a').length).toBe(2);
    expect(line.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer nofollow');
    expect(host.querySelector('[data-testid="question-sources"]')).toBeNull();
  });

  it('links the company guide once per company named in the sources', () => {
    const host = render([
      { ...sources[0], company: 'waymo' },
      { ...sources[1], company: 'waymo' },
    ]);
    const lines = Array.from(host.querySelectorAll<HTMLElement>('[data-testid="question-sources-company"]'));
    expect(lines.length).toBe(1);
    expect(lines[0].textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Reported in a public Waymo interview account. Waymo frontend interview questions',
    );
    const link = lines[0].querySelector('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/companies/waymo/preview');
    expect(link.getAttribute('rel')).toBeNull();
    expect(link.getAttribute('target')).toBeNull();
  });

  it('uses the brand label and a readable fallback for unknown company slugs', () => {
    const host = render([
      { ...sources[0], company: 'booking-com' },
      { ...sources[1], company: 'acme-corp' },
    ]);
    const texts = Array.from(
      host.querySelectorAll('[data-testid="question-sources-company"] a'),
      (link) => link.textContent?.trim(),
    );
    expect(texts).toEqual(['Booking.com frontend interview questions', 'Acme Corp frontend interview questions']);
  });

  it('appends the company guide link to the compact line', () => {
    const host = render([{ ...sources[0], company: 'waymo' }], 'compact');
    const line = host.querySelector('[data-testid="question-sources-compact"]') as HTMLElement;
    const links = Array.from(line.querySelectorAll('a'));
    expect(links.length).toBe(2);
    expect(links[1].getAttribute('href')).toBe('/companies/waymo/preview');
    expect(links[1].getAttribute('rel')).toBeNull();
    expect(line.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Public interview reports: PracHub (May 2026) · Waymo frontend interview questions',
    );
  });

  it('renders no company line when no source names a company', () => {
    const host = render(sources);
    expect(host.querySelector('[data-testid="question-sources-company"]')).toBeNull();
  });

  it('renders nothing for empty, missing or malformed input', () => {
    for (const value of [[], null, undefined, [{ label: 'x', url: 'http://insecure.example', publisher: 'P', date: '2026-01' }]] as any[]) {
      const host = render(value);
      expect(host.querySelector('[data-testid="question-sources"]')).toBeNull();
      expect(host.querySelector('[data-testid="question-sources-compact"]')).toBeNull();
    }
  });
});
