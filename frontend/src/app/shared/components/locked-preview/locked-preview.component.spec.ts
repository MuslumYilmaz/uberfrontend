import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { LockedPreviewData } from '../../../core/utils/locked-preview.util';
import { LockedPreviewComponent } from './locked-preview.component';

const CODING_UNLOCK =
  'Premium unlocks the runnable workspace, behavioral checks, implementation walkthrough, and edge-case discussion.';
const SYSTEM_DESIGN_UNLOCK =
  'Premium unlocks the full architecture walkthrough, evaluation rubric, trade-offs, and failure-mode analysis.';

const authoredCases: Array<{
  name: string;
  summary: string;
  outcomes: string[];
  unlockDescription: string;
}> = [
  {
    name: 'React Contact Form',
    summary: 'Build a React contact form that keeps fields controlled, validates input, and communicates each submission state.',
    outcomes: [
      'Manage fields as controlled React inputs.',
      'Show complete validation feedback.',
      'Prevent duplicate submissions while pending.',
      'Represent asynchronous states clearly.',
    ],
    unlockDescription: CODING_UNLOCK,
  },
  {
    name: 'JavaScript Throttle',
    summary: 'Implement a leading-only JavaScript throttle with an explicit timing contract.',
    outcomes: [
      'Execute the first call immediately.',
      'Ignore calls during the active interval.',
      'Preserve arguments and calling context.',
      'Allow calls after the interval boundary.',
    ],
    unlockDescription: CODING_UNLOCK,
  },
  {
    name: 'JavaScript Promise.all',
    summary: 'Implement a JavaScript Promise.all equivalent that coordinates values and promises.',
    outcomes: [
      'Normalize values and promises.',
      'Preserve input order.',
      'Resolve empty input predictably.',
      'Reject on the first failure.',
    ],
    unlockDescription: CODING_UNLOCK,
  },
  {
    name: 'React useEffect lifecycle',
    summary: 'Build a React effect with symmetrical setup and cleanup across its lifecycle.',
    outcomes: [
      'Pair setup with cleanup.',
      'Declare reactive dependencies.',
      'Remain correct in StrictMode.',
      'Switch resources safely.',
      'Release resources on unmount.',
    ],
    unlockDescription: CODING_UNLOCK,
  },
  {
    name: 'Multi-step Form with Autosave',
    summary: 'Design a multi-step form that preserves progress without interrupting input.',
    outcomes: [
      'Define step-state ownership.',
      'Choose a safe save cadence.',
      'Restore versioned drafts.',
      'Keep validation predictable.',
      'Clear saved state on discard or submit.',
    ],
    unlockDescription: SYSTEM_DESIGN_UNLOCK,
  },
  {
    name: 'Angular Tabs',
    summary: 'Build an accessible Angular tab switcher driven by a single active-tab state.',
    outcomes: [
      'Model one typed active-state value.',
      'Render the active panel with Angular @if control flow.',
      'Keep exactly one content panel visible.',
      'Connect accessible controls to labelled panels.',
    ],
    unlockDescription: CODING_UNLOCK,
  },
];

@Component({
  imports: [LockedPreviewComponent],
  template: `
    <app-locked-preview [data]="data">
      <button lockedPreviewCta type="button" data-testid="host-cta">View pricing</button>
    </app-locked-preview>
  `,
})
class LockedPreviewCtaHostComponent {
  data: LockedPreviewData = {
    what: 'Summary.',
    learningGoals: ['First outcome.'],
    unlockDescription: CODING_UNLOCK,
    constraints: [],
    snippet: { title: 'Not displayed', lines: [] },
    pitfalls: [],
    related: [{ title: 'Free item', to: ['/free'], premium: false }],
  };
}

describe('LockedPreviewComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LockedPreviewComponent, RouterTestingModule, LockedPreviewCtaHostComponent],
    }).compileComponents();
  });

  it('places the page pricing action inside "What Premium unlocks", ahead of the free links', () => {
    const fixture = TestBed.createComponent(LockedPreviewCtaHostComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    const cta = host.querySelector('[data-testid="host-cta"]') as HTMLElement;
    const unlockSection = host.querySelector('[data-testid="premium-preview-unlock"]')!.closest('section')!;
    expect(cta).toBeTruthy();
    expect(unlockSection.contains(cta)).toBeTrue();
    expect(cta.closest('.locked-preview-rich__cta')).toBeTruthy();
    const freeLinks = host.querySelector('.locked-preview-rich__links')!;
    expect(cta.compareDocumentPosition(freeLinks) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('leaves the action slot empty when the page projects no action', () => {
    const fixture = TestBed.createComponent(LockedPreviewComponent);
    fixture.componentInstance.data = new LockedPreviewCtaHostComponent().data;
    fixture.detectChanges();
    const slot = (fixture.nativeElement as HTMLElement).querySelector('.locked-preview-rich__cta') as HTMLElement;
    expect(slot.children.length).toBe(0);
    expect(getComputedStyle(slot).display).toBe('none');
  });

  for (const authored of authoredCases) {
    it(`renders the complete authored ${authored.name} teaser`, () => {
      const fixture = TestBed.createComponent(LockedPreviewComponent);
      fixture.componentInstance.data = {
        what: authored.summary,
        learningGoals: authored.outcomes,
        unlockDescription: authored.unlockDescription,
        constraints: [],
        snippet: { title: 'Not displayed', lines: [] },
        pitfalls: [],
        related: [],
      } satisfies LockedPreviewData;
      fixture.detectChanges();

      const host = fixture.nativeElement as HTMLElement;
      const visibleText = host.textContent || '';
      const outcomes = host.querySelectorAll('[data-testid="premium-preview-outcomes"] li');

      expect(host.querySelectorAll('[data-testid="premium-preview-rich"]').length).toBe(1);
      expect(host.querySelector('[data-testid="premium-preview"]')).toBeNull();
      expect(host.querySelector('[data-testid="premium-preview-summary"]')?.textContent?.trim())
        .toBe(authored.summary);
      expect(outcomes.length).toBe(authored.outcomes.length);
      expect(host.querySelector('[data-testid="premium-preview-unlock"]')?.textContent?.trim())
        .toBe(authored.unlockDescription);
      expect(visibleText).toContain("What you'll practice");
      expect(visibleText).not.toContain('….');
      expect(visibleText).not.toMatch(/Expect .+ decisions under .+ constraints/i);
    });
  }
});
