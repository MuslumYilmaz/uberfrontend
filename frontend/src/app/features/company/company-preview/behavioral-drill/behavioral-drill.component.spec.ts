import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AMAZON_COMPANY_PREVIEW } from '../../../../shared/company-previews/amazon-preview-content';
import { BehavioralDrill } from '../../../../shared/company-previews/authored-company-preview.model';
import { COMPANY_EDITORIAL_NOTES } from '../../../../shared/company-previews/company-editorial-notes';
import { META_COMPANY_PREVIEW } from '../../../../shared/company-previews/meta-preview-content';
import { GOOGLE_GOOGLEYNESS_SPOTLIGHT } from '../google-preview-content';
import { NETFLIX_CULTURE_SPOTLIGHT } from '../netflix-preview-content';
import {
  BEHAVIORAL_DRILL_APPROACH_CHECKS,
  BEHAVIORAL_DRILL_CHECKS,
  BEHAVIORAL_DRILL_VIEW_CHECKS,
  BehavioralDrillComponent,
  behavioralDrillKey,
  readBehavioralDrill,
} from './behavioral-drill.component';

const DRILL: BehavioralDrill = {
  questions: [
    { id: 'disagreement', text: 'Tell me about a disagreement with a coworker.', source: 'Seattle, 2019' },
    { id: 'deadline', text: 'Tell me about a tight deadline.', source: 'Seattle, 2019' },
    { id: 'customer', text: 'Tell me about a customer you helped.', source: 'Vancouver, 2021' },
  ],
  checks: ['I can name the principle it shows.'],
};
const COMPANY = 'drill-test';

describe('BehavioralDrillComponent', () => {
  let fixture: ComponentFixture<BehavioralDrillComponent>;
  const host = () => fixture.nativeElement as HTMLElement;
  const el = <T extends HTMLElement>(testId: string) => host().querySelector(`[data-testid="${testId}"]`) as T | null;

  const render = async (open = DRILL.questions.length) => {
    fixture = TestBed.createComponent(BehavioralDrillComponent);
    fixture.componentRef.setInput('drill', DRILL);
    fixture.componentRef.setInput('company', COMPANY);
    fixture.componentRef.setInput('openQuestions', open);
    fixture.detectChanges();
    // The draft is read once the view is in the browser.
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const type = (testId: string, value: string) => {
    const field = el<HTMLTextAreaElement>(testId)!;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const choose = (testId: string) => {
    el<HTMLInputElement>(testId)!.click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    localStorage.removeItem(behavioralDrillKey(COMPANY));
    await TestBed.configureTestingModule({ imports: [BehavioralDrillComponent] }).compileComponents();
  });

  afterEach(() => localStorage.removeItem(behavioralDrillKey(COMPANY)));

  it('lists the questions with their sources and tells the first one in the four STAR parts', async () => {
    await render();
    const choices = Array.from(host().querySelectorAll('.drill__questions li')).map((item) => item.textContent?.replace(/\s+/g, ' ').trim());
    expect(choices).toEqual([
      'Tell me about a disagreement with a coworker. Seattle, 2019',
      'Tell me about a tight deadline. Seattle, 2019',
      'Tell me about a customer you helped. Vancouver, 2021',
    ]);
    expect(el<HTMLInputElement>('behavioral-drill-question-disagreement')?.checked).toBeTrue();
    expect(el('behavioral-drill-asked')?.textContent).toContain('Tell me about a disagreement with a coworker.');
    expect(Array.from(host().querySelectorAll('textarea')).map((field) => field.getAttribute('data-testid')))
      .toEqual(['behavioral-drill-situation', 'behavioral-drill-task', 'behavioral-drill-action', 'behavioral-drill-result']);
    // Every story gets the general checks, then the company's own.
    expect(Array.from(host().querySelectorAll('.drill__checks li')).map((item) => item.textContent?.trim()))
      .toEqual([...BEHAVIORAL_DRILL_CHECKS, 'I can name the principle it shows.']);
    expect(el('behavioral-drill-notes')).toBeNull();
  });

  it('keeps a story per question on this device and opens on the last question and shape', async () => {
    await render();
    type('behavioral-drill-situation', 'Two teams wanted the same release slot.');
    choose('behavioral-drill-question-deadline');
    expect(el<HTMLTextAreaElement>('behavioral-drill-situation')?.value).toBe('');
    type('behavioral-drill-action', 'I cut the scope to the checkout fix.');
    choose('behavioral-drill-shape-car');
    expect(Array.from(host().querySelectorAll('textarea')).map((field) => field.getAttribute('data-testid')))
      .toEqual(['behavioral-drill-context', 'behavioral-drill-action', 'behavioral-drill-result']);
    // The action carries over between the shapes; the context is its own part.
    expect(el<HTMLTextAreaElement>('behavioral-drill-action')?.value).toBe('I cut the scope to the checkout fix.');
    fixture.destroy();

    await render();
    expect(el<HTMLInputElement>('behavioral-drill-question-deadline')?.checked).toBeTrue();
    expect(el<HTMLInputElement>('behavioral-drill-shape-car')?.checked).toBeTrue();
    expect(el<HTMLTextAreaElement>('behavioral-drill-action')?.value).toBe('I cut the scope to the checkout fix.');
    choose('behavioral-drill-question-disagreement');
    choose('behavioral-drill-shape-star');
    expect(el<HTMLTextAreaElement>('behavioral-drill-situation')?.value).toBe('Two teams wanted the same release slot.');
    expect(readBehavioralDrill(COMPANY)?.stories['deadline']?.action).toBe('I cut the scope to the checkout fix.');
  });

  it('reads the story back: its length out loud, "we" against "I", and a result without a number', async () => {
    await render();
    type('behavioral-drill-action', 'We split the work, we reviewed it together and our lead approved it.');
    type('behavioral-drill-result', 'The release went out on time and the team was happy.');
    const notes = () => Array.from(host().querySelectorAll('[data-testid="behavioral-drill-notes"] li')).map((item) => item.textContent);
    expect(notes()).toEqual([
      'About 24 words: about half a minute out loud, under the minute and a half we suggest: say what you did and what changed.',
      'The actions say “we” 3 times and “I” not at all: say what you did.',
      'The result has no number yet: a time saved, a count or a percentage makes it concrete.',
    ]);
    type('behavioral-drill-action', 'I split the work into three reviews and I asked our lead to approve it.');
    type('behavioral-drill-result', 'The release went out 2 days early.');
    expect(notes()).toEqual(['About 22 words: about half a minute out loud, under the minute and a half we suggest: say what you did and what changed.']);
    // Two minutes of story sits inside the length we suggest; four minutes is more than it.
    type('behavioral-drill-situation', Array(240).fill('word').join(' '));
    expect(notes()[0]).toBe('About 262 words: about 2 minutes out loud, inside the one and a half to three minutes we suggest.');
    type('behavioral-drill-situation', Array(500).fill('word').join(' '));
    expect(notes()[0]).toBe('About 522 words: about 4 minutes out loud, more than the three minutes we suggest: keep some details for the follow-up questions.');
  });

  it('asks a "How would you…" question as an approach, then a time it was done', async () => {
    fixture = TestBed.createComponent(BehavioralDrillComponent);
    fixture.componentRef.setInput('drill', {
      ...DRILL,
      questions: [{ id: 'credit', text: 'A teammate takes the credit for shared work. What do you do?', source: 'LeetCode', kind: 'approach' }, ...DRILL.questions],
    });
    fixture.componentRef.setInput('company', COMPANY);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(Array.from(host().querySelectorAll('textarea')).map((field) => field.getAttribute('data-testid'))).toEqual(['behavioral-drill-approach', 'behavioral-drill-example']);
    expect(el('behavioral-drill-shape-star')).toBeNull();
    expect(Array.from(host().querySelectorAll('.drill__checks li')).map((item) => item.textContent?.trim()))
      .toEqual([...BEHAVIORAL_DRILL_APPROACH_CHECKS, 'I can name the principle it shows.']);
    // The example is where "we" and "I" are counted.
    type('behavioral-drill-example', 'We talked, we agreed and our manager split the credit.');
    expect(Array.from(host().querySelectorAll('[data-testid="behavioral-drill-notes"] li')).map((item) => item.textContent))
      .toContain('The example says “we” 3 times and “I” not at all: say what you did.');
  });

  it('keeps the questions after the open ones under the blur and out of reach, and falls back to the first', async () => {
    localStorage.setItem(behavioralDrillKey(COMPANY), JSON.stringify({ question: 'customer', shape: 'star', stories: {} }));
    await render(1);
    expect(el<HTMLInputElement>('behavioral-drill-question-disagreement')?.disabled).toBeFalse();
    expect(el<HTMLInputElement>('behavioral-drill-question-deadline')?.disabled).toBeTrue();
    expect(el<HTMLInputElement>('behavioral-drill-question-customer')?.disabled).toBeTrue();
    const locked = Array.from(host().querySelectorAll('.drill__questions .premium-locked'));
    expect(locked.length).toBe(2);
    expect(locked.every((item) => item.hasAttribute('data-nosnippet') && item.hasAttribute('inert'))).toBeTrue();
    expect(host().querySelectorAll('.drill__tag').length).toBe(2);
    // A story saved for a question this reader cannot pick now opens on the first one.
    expect(el<HTMLInputElement>('behavioral-drill-question-disagreement')?.checked).toBeTrue();
    expect(el('behavioral-drill-asked')?.textContent).toContain('a disagreement with a coworker');
  });

  it('ticks checks per story and clears only the picked story', async () => {
    await render();
    type('behavioral-drill-situation', 'Two teams wanted the same release slot.');
    choose('behavioral-drill-check-0');
    choose('behavioral-drill-check-4');
    expect(readBehavioralDrill(COMPANY)?.stories['disagreement']?.checked).toEqual([0, 4]);
    choose('behavioral-drill-question-deadline');
    type('behavioral-drill-situation', 'A launch moved up a week.');
    expect(el<HTMLInputElement>('behavioral-drill-check-0')?.checked).toBeFalse();

    el<HTMLButtonElement>('behavioral-drill-clear')!.click();
    fixture.detectChanges();
    expect(el<HTMLTextAreaElement>('behavioral-drill-situation')?.value).toBe('');
    expect(readBehavioralDrill(COMPANY)?.stories['deadline']).toBeUndefined();
    expect(readBehavioralDrill(COMPANY)?.stories['disagreement']?.situation).toBe('Two teams wanted the same release slot.');
  });

  it('asks for a view in one field, without the STAR or CAR shapes and with the checks for a view', async () => {
    fixture = TestBed.createComponent(BehavioralDrillComponent);
    fixture.componentRef.setInput('drill', {
      ...DRILL,
      questions: [{ id: 'memo', text: 'Which parts of the memo resonate with you?', source: 'Netflix', kind: 'view' }, ...DRILL.questions],
    });
    fixture.componentRef.setInput('company', COMPANY);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(Array.from(host().querySelectorAll('textarea')).map((field) => field.getAttribute('data-testid'))).toEqual(['behavioral-drill-answer']);
    expect(el('behavioral-drill-shape-star')).toBeNull();
    expect(Array.from(host().querySelectorAll('.drill__checks li')).map((item) => item.textContent?.trim()))
      .toEqual([...BEHAVIORAL_DRILL_VIEW_CHECKS, 'I can name the principle it shows.']);
    // Only the length reads back: a view has no actions or result to weigh.
    type('behavioral-drill-answer', 'Candor, because we fixed a broken release process after I said so in a review.');
    expect(Array.from(host().querySelectorAll('[data-testid="behavioral-drill-notes"] li')).map((item) => item.textContent))
      .toEqual(['About 15 words: about half a minute out loud, inside the two minutes we suggest for a view.']);
    expect(readBehavioralDrill(COMPANY)?.stories['memo']?.answer).toBe('Candor, because we fixed a broken release process after I said so in a review.');

    // A story question in the same drill keeps its parts and shapes.
    choose('behavioral-drill-question-disagreement');
    expect(el('behavioral-drill-shape-star')).not.toBeNull();
    expect(host().querySelectorAll('textarea').length).toBe(4);
  });

  it('gives each guide\'s drill unique ids, a source for every question and its own checks', () => {
    const drills = {
      amazon: AMAZON_COMPANY_PREVIEW.roundSpotlights?.find((round) => round.drill)?.drill,
      google: GOOGLE_GOOGLEYNESS_SPOTLIGHT.drill,
      meta: META_COMPANY_PREVIEW.roundSpotlights?.find((round) => round.drill)?.drill,
      netflix: NETFLIX_CULTURE_SPOTLIGHT.drill,
      apple: COMPANY_EDITORIAL_NOTES['apple']?.roundSpotlights?.find((round) => round.drill)?.drill,
    };
    for (const [company, drill] of Object.entries(drills)) {
      expect(drill).withContext(company).toBeDefined();
      const ids = drill!.questions.map((question) => question.id);
      expect(new Set(ids).size).withContext(company).toBe(ids.length);
      expect(ids.length).withContext(company).toBeGreaterThanOrEqual(6);
      for (const question of drill!.questions) {
        expect(question.text).withContext(`${company} ${question.id}`).toMatch(/^[A-Z].*[.?]$/);
        expect(question.source.trim()).withContext(`${company} ${question.id}`).not.toBe('');
      }
      expect(drill!.checks.length).withContext(company).toBeGreaterThanOrEqual(2);
      // Most questions ask for a story; a view is the exception.
      const views = drill!.questions.filter((question) => question.kind === 'view').length;
      expect(views).withContext(company).toBeLessThan(drill!.questions.length / 2 + 1);
    }
  });
});
