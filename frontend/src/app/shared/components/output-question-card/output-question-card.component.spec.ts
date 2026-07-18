import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { OutputChallenge } from '../../../core/models/question.model';
import {
  OUTPUT_QUESTION_RANDOM,
  OutputQuestionCardComponent,
} from './output-question-card.component';

describe('OutputQuestionCardComponent', () => {
  const challenge: OutputChallenge = {
    language: 'javascript',
    runtime: 'browser',
    responseType: 'single-choice',
    prompt: 'In what order are the values logged?',
    code: [
      "console.log('A');",
      "setTimeout(() => console.log('B'), 0);",
      "Promise.resolve().then(() => console.log('C'));",
      "console.log('E');",
    ].join('\n'),
    options: [
      { id: 'timer-first', lines: ['A', 'E', 'C', 'B', 'D'] },
      { id: 'correct', lines: ['A', 'E', 'C', 'D', 'B'] },
      { id: 'promise-last', lines: ['A', 'E', 'B', 'C', 'D'] },
    ],
    correctOptionId: 'correct',
    explanation: 'Synchronous work runs first, then microtasks, then the timer.',
  };

  let fixture: ComponentFixture<OutputQuestionCardComponent>;
  let random: jasmine.Spy<() => number>;

  async function createComponent(
    platformId: 'browser' | 'server' = 'browser',
    randomValues: number[] = [0, 0],
    shown?: jasmine.Spy,
  ): Promise<void> {
    random = jasmine.createSpy('random');
    random.and.callFake(() => randomValues.shift() ?? 0);

    await TestBed.configureTestingModule({
      imports: [OutputQuestionCardComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: platformId },
        { provide: OUTPUT_QUESTION_RANDOM, useValue: random },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OutputQuestionCardComponent);
    if (shown) fixture.componentInstance.shown.subscribe(shown);
    fixture.componentRef.setInput('challenge', challenge);
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('renders only a hydration-safe placeholder on the server', async () => {
    const shown = jasmine.createSpy('shown');
    await createComponent('server', [0, 0], shown);

    expect(fixture.nativeElement.querySelector('[data-testid="output-question-placeholder"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('input[type="radio"]')).toBeNull();
    expect(fixture.nativeElement.hasAttribute('ngskiphydration')).toBeTrue();
    expect(random).not.toHaveBeenCalled();
    expect(shown).not.toHaveBeenCalled();
  });

  it('shuffles once per challenge and keeps the permutation stable during an attempt', async () => {
    const shown = jasmine.createSpy('shown');
    await createComponent('browser', [0, 0], shown);

    const component = fixture.componentInstance;
    expect(component.shuffledOptions().map((option) => option.id)).toEqual([
      'correct',
      'promise-last',
      'timer-first',
    ]);
    expect(random.calls.count()).toBe(2);
    expect(shown).toHaveBeenCalledOnceWith({ runtime: 'browser', optionCount: 3 });

    const firstRadio: HTMLInputElement = fixture.nativeElement.querySelector('input[type="radio"]');
    firstRadio.click();
    fixture.detectChanges();
    const orderAfterSelection = component.shuffledOptions().map((option) => option.id);

    fixture.detectChanges();

    expect(component.shuffledOptions().map((option) => option.id)).toEqual(orderAfterSelection);
    expect(random.calls.count()).toBe(2);
    expect(shown).toHaveBeenCalledTimes(1);
  });

  it('uses native radio semantics and disables checking until an option is selected', async () => {
    await createComponent();

    const fieldset: HTMLFieldSetElement = fixture.nativeElement.querySelector('fieldset');
    const radios: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input[type="radio"]'),
    );
    const checkButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="output-question-check"]',
    );
    const announcement: HTMLElement = fixture.nativeElement.querySelector(
      '.output-question-card__announcement',
    );

    expect(fieldset).not.toBeNull();
    expect(new Set(radios.map((radio) => radio.name)).size).toBe(1);
    expect(checkButton.disabled).toBeTrue();
    expect(announcement.getAttribute('aria-live')).toBe('polite');

    radios[0].click();
    fixture.detectChanges();

    expect(checkButton.disabled).toBeFalse();
  });

  it('locks the choices and emits the minimal correct result after submission', async () => {
    await createComponent();

    const answered = jasmine.createSpy('answered');
    fixture.componentInstance.answered.subscribe(answered);

    const correctRadio: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[value="correct"]',
    );
    correctRadio.click();
    fixture.detectChanges();

    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    const submitEvent = new Event('submit', { cancelable: true });
    form.dispatchEvent(submitEvent);
    fixture.detectChanges();

    const fieldset: HTMLFieldSetElement = fixture.nativeElement.querySelector('fieldset');
    const feedback: HTMLElement = fixture.nativeElement.querySelector(
      '[data-testid="output-question-feedback"]',
    );
    const canonical: HTMLElement = fixture.nativeElement.querySelector(
      '[data-testid="output-question-canonical"]',
    );

    expect(fieldset.disabled).toBeTrue();
    expect(submitEvent.defaultPrevented).toBeTrue();
    expect(feedback.textContent).toContain('Correct');
    expect(canonical.textContent?.replace(/\s+/g, '')).toContain('AECDB');
    expect(feedback.textContent).toContain(challenge.explanation);
    expect(answered).toHaveBeenCalledOnceWith({
      correct: true,
      runtime: 'browser',
      optionCount: 3,
    });

    form.dispatchEvent(new Event('submit'));
    expect(answered).toHaveBeenCalledTimes(1);
  });

  it('reveals the canonical answer for a wrong choice and emits deep-dive intent', async () => {
    await createComponent();

    const answered = jasmine.createSpy('answered');
    const deepDive = jasmine.createSpy('deepDive');
    fixture.componentInstance.answered.subscribe(answered);
    fixture.componentInstance.deepDiveRequested.subscribe(deepDive);

    expect(fixture.nativeElement.querySelector('[data-testid="output-question-deep-dive"]')).toBeNull();

    const wrongRadio: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[value="timer-first"]',
    );
    wrongRadio.click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const feedback: HTMLElement = fixture.nativeElement.querySelector(
      '[data-testid="output-question-feedback"]',
    );
    const deepDiveButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="output-question-deep-dive"]',
    );

    expect(feedback.textContent).toContain('Not quite');
    expect(feedback.textContent?.replace(/\s+/g, '')).toContain('AECDB');
    expect(answered).toHaveBeenCalledOnceWith({
      correct: false,
      runtime: 'browser',
      optionCount: 3,
    });

    deepDiveButton.click();
    expect(deepDive).toHaveBeenCalledTimes(1);
  });

  it('resets selection and feedback when the challenge input changes', async () => {
    await createComponent('browser', [0, 0, 0.9, 0.9]);

    const wrongRadio: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[value="timer-first"]',
    );
    wrongRadio.click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const nextChallenge: OutputChallenge = {
      ...challenge,
      runtime: 'node',
      prompt: 'What is logged in Node.js?',
    };
    fixture.componentRef.setInput('challenge', nextChallenge);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const checkButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="output-question-check"]',
    );
    const fieldset: HTMLFieldSetElement = fixture.nativeElement.querySelector('fieldset');

    expect(component.selectedOptionId()).toBeNull();
    expect(component.outcome()).toBeNull();
    expect(fieldset.disabled).toBeFalse();
    expect(checkButton.disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('[data-testid="output-question-feedback"]')).toBeNull();
    expect(random.calls.count()).toBe(4);
  });
});
