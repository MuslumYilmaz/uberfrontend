import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
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

  it('renders nothing for empty, missing or malformed input', () => {
    for (const value of [[], null, undefined, [{ label: 'x', url: 'http://insecure.example', publisher: 'P', date: '2026-01' }]] as any[]) {
      const host = render(value);
      expect(host.querySelector('[data-testid="question-sources"]')).toBeNull();
      expect(host.querySelector('[data-testid="question-sources-compact"]')).toBeNull();
    }
  });
});
