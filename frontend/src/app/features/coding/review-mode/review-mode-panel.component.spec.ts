import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewModeScenario } from '../../../core/models/review-mode.model';
import { ReviewModePanelComponent, readReviewDraft, reviewDraftKey } from './review-mode-panel.component';

const SCENARIO: ReviewModeScenario = {
  schemaVersion: '1.0.0',
  id: 'issues-review-v1',
  title: 'Issue list review',
  access: 'premium',
  format: 'review',
  sessionMinutes: 90,
  supportedQuestions: { vue: 'vue-issue-list-review' },
  mergeRequest: {
    title: 'Add the issue list',
    description: 'Lists open issues and filters them by label.',
    issue: { title: 'Issue list', requirements: ['Load the issues once.', 'Filter by label.'] },
    files: [
      { path: 'src/App.vue', before: '<template>\n  <p>Soon</p>\n</template>\n', after: '<template>\n  <ul></ul>\n</template>\n' },
      { path: 'src/App.spec.js', before: '', after: "it('renders', () => {});\n" },
    ],
  },
  sampleReview: {
    summary: 'Block on the repeated request.',
    comments: [
      { path: 'src/App.spec.js', line: 1, severity: 'minor', title: 'Empty test', body: 'Assert the list renders.', checked: false },
      { path: 'src/App.vue', line: 2, severity: 'blocker', title: 'Loads on every click', body: 'Load once on mount.', checked: true },
      { path: 'src/App.vue', line: 1, severity: 'minor', title: 'No heading', body: 'Name the list.', checked: false },
    ],
  },
};
const QUESTION_ID = 'vue-issue-list-review';
const FIND: ReviewModeScenario = {
  schemaVersion: '1.0.0',
  id: 'budget-case',
  title: 'Budget case',
  access: 'premium',
  format: 'find',
  sessionMinutes: 45,
  supportedQuestions: { javascript: 'js-debug-budget' },
  workedExample: { prompt: 'Work $100 a week by hand.', answer: '$433.33 a month.' },
  mergeRequest: {
    title: 'Find the bug in the budget',
    description: 'Find it without running the code.',
    issue: { title: 'What it should do', requirements: ['A weekly expense happens 52 times a year.'] },
    files: [{ path: 'budget.js', before: '', after: 'const weekly = 100;\nconst monthly = weekly * 4;\nexport default monthly;\n' }],
  },
  sampleReview: {
    summary: 'Line 2 counts four weeks a month.',
    comments: [
      { path: 'budget.js', line: 3, severity: 'minor', title: 'Not rounded', body: 'Round to cents.', checked: false },
      { path: 'budget.js', line: 2, severity: 'blocker', title: 'Four weeks a month', body: 'Use 52 / 12.', checked: true },
    ],
  },
};

describe('ReviewModePanelComponent', () => {
  let fixture: ComponentFixture<ReviewModePanelComponent>;
  let host: HTMLElement;

  const render = () => {
    fixture = TestBed.createComponent(ReviewModePanelComponent);
    fixture.componentRef.setInput('scenario', SCENARIO);
    fixture.componentRef.setInput('questionId', QUESTION_ID);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  };
  const type = (testId: string, value: string) => {
    const field = host.querySelector(`[data-testid="${testId}"]`) as HTMLTextAreaElement;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const click = (testId: string) => {
    (host.querySelector(`[data-testid="${testId}"]`) as HTMLButtonElement).click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    localStorage.removeItem(reviewDraftKey(QUESTION_ID));
    await TestBed.configureTestingModule({ imports: [ReviewModePanelComponent] }).compileComponents();
  });

  afterEach(() => localStorage.removeItem(reviewDraftKey(QUESTION_ID)));

  it('gives a review sent ahead its own clock, then starts the interview\'s when the review is handed in', () => {
    const renderTimed = () => {
      fixture = TestBed.createComponent(ReviewModePanelComponent);
      fixture.componentRef.setInput('scenario', { ...SCENARIO, reviewMinutes: 60 });
      fixture.componentRef.setInput('questionId', QUESTION_ID);
      fixture.detectChanges();
      host = fixture.nativeElement as HTMLElement;
    };
    const timer = () => host.querySelector('[data-testid="review-mode-timer"]')?.textContent?.trim();

    renderTimed();
    expect(timer()).toBe('Review: 60 of 60 min left');
    expect(readReviewDraft(QUESTION_ID)?.interviewStartedAt).toBeUndefined();
    click('review-mode-start-fixes');
    expect(timer()).toBe('Interview: 90 of 90 min left');
    expect(readReviewDraft(QUESTION_ID)?.interviewStartedAt).toEqual(jasmine.any(Number));
    fixture.destroy();

    // An hour and ten minutes into a review left open, its clock says how far over it is.
    localStorage.setItem(reviewDraftKey(QUESTION_ID), JSON.stringify({ open: true, startedAt: Date.now() - 70 * 60_000, phase: 'review', comments: {}, summary: '' }));
    renderTimed();
    expect(timer()).toBe('Review: time is up, 10 min over 60');
  });

  it('shows the request, a diff for each file and the session clock', () => {
    render();
    expect(host.querySelector('h1')?.textContent).toContain('Add the issue list');
    expect(host.textContent).toContain('Load the issues once.');
    expect(host.querySelector('[data-testid="review-mode-timer"]')?.textContent).toContain('90 of 90 min left');
    const first = host.querySelector('[data-testid="review-mode-file-0"]') as HTMLElement;
    expect(first.querySelectorAll('.review-mode__row--removed').length).toBe(1);
    expect(first.querySelectorAll('.review-mode__row--added').length).toBe(1);
    expect(first.querySelector('.review-mode__stats')?.textContent?.replace(/\s+/g, '')).toBe('+1-1');
    const added = host.querySelector('[data-testid="review-mode-file-1"]') as HTMLElement;
    expect(added.querySelectorAll('.review-mode__row--added').length).toBe(1);
  });

  it('keeps the comments on this device and carries them into the fix and compare steps', () => {
    render();
    type('review-mode-comment-0', 'L2: the list loads on every click');
    type('review-mode-summary', 'Block on the request.');
    expect(readReviewDraft(QUESTION_ID)?.comments['src/App.vue']).toBe('L2: the list loads on every click');

    click('review-mode-start-fixes');
    expect(readReviewDraft(QUESTION_ID)?.phase).toBe('fix');
    expect(host.textContent).toContain('L2: the list loads on every click');

    click('review-mode-compare');
    const sample = host.querySelector('[data-testid="review-mode-sample"]') as HTMLElement;
    // The blocker comes first, whatever order the file lists it in; then the files in the order the diff shows them.
    expect(Array.from(sample.querySelectorAll('.review-mode__comment-title')).map((title) => title.textContent))
      .toEqual(['Loads on every click', 'No heading', 'Empty test']);
    expect(sample.textContent).toContain('Checked in the workspace');
  });

  it('runs a find case: an example by hand, a reason for each marked line, then the sample answer and the fix', () => {
    localStorage.removeItem(reviewDraftKey('js-debug-budget'));
    fixture = TestBed.createComponent(ReviewModePanelComponent);
    fixture.componentRef.setInput('scenario', FIND);
    fixture.componentRef.setInput('questionId', 'js-debug-budget');
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
    const phases: string[] = [];
    fixture.componentInstance.phaseChange.subscribe((phase) => phases.push(phase));

    expect(host.textContent).toContain('Case: find the bug');
    expect(host.textContent).toContain('A weekly expense happens 52 times a year.');
    // The code reads as it is, numbered, with no diff around it.
    expect(host.querySelectorAll('.review-mode__row--added, .review-mode__row--removed, .review-mode__row--gap').length).toBe(0);
    expect(host.querySelector('[data-testid="review-mode-findings"]')?.textContent).toContain('Mark a line number');
    type('review-mode-example', '100 × 52 / 12 = 433.33');

    // Marking a line opens a finding on it; unmarking drops it.
    click('review-mode-mark-0-3');
    expect(host.querySelector('[data-testid="review-mode-finding-3"]')).not.toBeNull();
    click('review-mode-mark-0-3');
    expect(host.querySelector('[data-testid="review-mode-finding-3"]')).toBeNull();
    click('review-mode-mark-0-2');
    expect(host.querySelector('[data-testid="review-mode-mark-0-2"]')?.getAttribute('aria-pressed')).toBe('true');
    type('review-mode-finding-2', 'Four weeks a month; use 52 / 12.');
    type('review-mode-summary', 'Line 2 undercounts every weekly cost.');
    const draft = readReviewDraft('js-debug-budget');
    expect(draft?.comments).toEqual({ 'budget.js#L2': 'Four weeks a month; use 52 / 12.' });
    expect(draft?.example).toBe('100 × 52 / 12 = 433.33');

    click('review-mode-compare');
    const sample = host.querySelector('[data-testid="review-mode-sample"]') as HTMLElement;
    // The bug first, then the risks, under the case's own labels.
    expect(Array.from(sample.querySelectorAll('.review-mode__severity')).map((label) => label.textContent)).toEqual(['The bug', 'A risk']);
    expect(sample.querySelector('[data-testid="review-mode-sample-example"]')?.textContent).toBe('$433.33 a month.');
    expect(sample.textContent).toContain('budget.js:2');
    expect(sample.textContent).toContain('Four weeks a month; use 52 / 12.');
    expect(sample.textContent).toContain('100 × 52 / 12 = 433.33');

    click('review-mode-start-fixes');
    expect(host.textContent).toContain('The code runs now');
    expect(phases).toEqual(['compare', 'fix']);
    localStorage.removeItem(reviewDraftKey('js-debug-budget'));
  });

  it('restores a draft, and leaving keeps the comments for the next start', () => {
    render();
    type('review-mode-comment-0', 'L2: cache the response');
    click('review-mode-start-fixes');

    render();
    expect(host.textContent).toContain('Implement the top fixes');

    let exited = false;
    fixture.componentInstance.exit.subscribe(() => (exited = true));
    click('review-mode-exit');
    expect(exited).toBeTrue();
    const draft = readReviewDraft(QUESTION_ID);
    expect(draft?.open).toBeFalse();
    expect(draft?.comments['src/App.vue']).toBe('L2: cache the response');
  });
});
