import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PressureModeService } from './pressure-mode.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('PressureModeService', () => {
  let service: PressureModeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(PressureModeService);
  });

  it('normalizes one shared cumulative framework scenario', () => {
    const scenario = service.normalize(validScenario());

    expect(scenario).not.toBeNull();
    expect(scenario?.supportedQuestions).toEqual({
      react: 'react-counter',
      angular: 'angular-counter-starter',
      vue: 'vue-counter',
    });
    expect(scenario?.rounds.map((round) => round.id)).toEqual([
      'base',
      'step',
      'keyboard',
      'lifecycle',
    ]);
    expect(
      scenario?.rounds.flatMap((round) => round.frameworkTests).length,
    ).toBe(5);
  });

  it('keeps role, label and text locators, the checked, line-through and mockRandom steps, and drops unknown fields', () => {
    const payload = validScenario();
    payload.rounds[0].frameworkTests[0].steps = [
      { type: 'click', by: { role: 'button', name: 'Add', css: '.primary' } },
      { type: 'expectChecked', by: { role: 'checkbox' }, index: 1, expected: false },
      { type: 'expectLineThrough', by: { label: 'Milk' } },
      { type: 'expectExists', by: { text: 'No tasks yet.' } },
      { type: 'expectExists', by: 'button' },
      { type: 'mockRandom', values: [0.55, 'x', 0.1] },
    ];

    expect(service.normalize(payload)?.rounds[0].frameworkTests[0].steps).toEqual([
      { type: 'click', by: { role: 'button', name: 'Add' } },
      { type: 'expectChecked', by: { role: 'checkbox' }, index: 1, expected: false },
      { type: 'expectLineThrough', by: { label: 'Milk' } },
      { type: 'expectExists', by: { text: 'No tasks yet.' } },
      { type: 'expectExists' },
      { type: 'mockRandom', values: [0.55, 0.1] },
    ]);
  });

  it('rejects scenarios that exceed the six-check runner budget', () => {
    const payload = validScenario();
    payload.rounds[3].frameworkTests.push(
      { id: 'extra-1', name: 'Extra 1', steps: [{ type: 'expectExists', selector: 'main' }] },
      { id: 'extra-2', name: 'Extra 2', steps: [{ type: 'expectExists', selector: 'main' }] },
    );

    expect(service.normalize(payload)).toBeNull();
  });

  it('accepts a single-framework scenario when every framework map agrees', () => {
    const scenario = service.normalize(singleFrameworkScenario());

    expect(scenario?.supportedQuestions).toEqual({ react: 'react-counter' });
    expect(scenario?.solutionAssets).toEqual({
      react: 'assets/sb/react/solution/react-counter-pressure-solution.v1.json',
    });
    expect(scenario?.debrief.frameworkNotes).toEqual({ react: 'React note.' });
  });

  it('rejects framework maps that disagree or support no framework', () => {
    const missingSolution = validScenario();
    delete (missingSolution.solutionAssets as any).vue;
    expect(service.normalize(missingSolution)).toBeNull();

    const missingNote = validScenario();
    delete (missingNote.debrief.frameworkNotes as any).vue;
    expect(service.normalize(missingNote)).toBeNull();

    const extraSolution = singleFrameworkScenario();
    extraSolution.solutionAssets.vue = 'assets/sb/vue/solution/vue-counter-pressure-solution.v1.json';
    expect(service.normalize(extraSolution)).toBeNull();

    const blankQuestion = validScenario();
    blankQuestion.supportedQuestions.vue = '  ';
    expect(service.normalize(blankQuestion)).toBeNull();

    const noFrameworks = singleFrameworkScenario();
    noFrameworks.supportedQuestions = {};
    noFrameworks.solutionAssets = {};
    noFrameworks.debrief.frameworkNotes = {};
    expect(service.normalize(noFrameworks)).toBeNull();
  });

  it('rejects unsafe solution assets', () => {
    const unsafeAsset = validScenario();
    unsafeAsset.solutionAssets.react = 'https://example.com/solution.json';
    expect(service.normalize(unsafeAsset)).toBeNull();
  });
});

function singleFrameworkScenario(): any {
  const scenario = validScenario();
  for (const framework of ['angular', 'vue']) {
    delete scenario.supportedQuestions[framework];
    delete scenario.solutionAssets[framework];
    delete scenario.debrief.frameworkNotes[framework];
  }
  return scenario;
}

function validScenario(): any {
  const check = (id: string) => ({
    id,
    name: id,
    steps: [{ type: 'expectExists', selector: 'main' }],
  });
  return {
    schemaVersion: '1.0.0',
    id: 'counter-pressure-v1',
    family: 'counter',
    title: 'Counter Pressure',
    access: 'free',
    estimatedMinutes: 35,
    supportedQuestions: {
      react: 'react-counter',
      angular: 'angular-counter-starter',
      vue: 'vue-counter',
    },
    rounds: [
      {
        id: 'base',
        title: 'Base',
        interviewerPrompt: 'Build the base.',
        constraints: ['Start at zero.'],
        frameworkTests: [check('base')],
      },
      {
        id: 'step',
        title: 'Step',
        interviewerPrompt: 'Add step.',
        constraints: ['Use the step.'],
        frameworkTests: [check('step')],
      },
      {
        id: 'keyboard',
        title: 'Keyboard',
        interviewerPrompt: 'Add keyboard support.',
        constraints: ['Support ArrowUp.'],
        frameworkTests: [check('keyboard')],
      },
      {
        id: 'lifecycle',
        title: 'Lifecycle',
        interviewerPrompt: 'Clean up.',
        constraints: ['Clear timers.'],
        frameworkTests: [check('auto'), check('cleanup')],
      },
    ],
    debrief: {
      title: 'Complete',
      summary: 'Done.',
      takeaways: ['Keep state transitions shared.'],
      frameworkNotes: {
        react: 'React note.',
        angular: 'Angular note.',
        vue: 'Vue note.',
      },
    },
    solutionAssets: {
      react: 'assets/sb/react/solution/react-counter-pressure-solution.v1.json',
      angular: 'assets/sb/angular/solution/angular-counter-pressure-solution.v1.json',
      vue: 'assets/sb/vue/solution/vue-counter-pressure-solution.v1.json',
    },
  };
}
