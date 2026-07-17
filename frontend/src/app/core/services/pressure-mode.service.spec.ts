import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PressureModeService } from './pressure-mode.service';

describe('PressureModeService', () => {
  let service: PressureModeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
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

  it('rejects scenarios that exceed the six-check runner budget', () => {
    const payload = validScenario();
    payload.rounds[3].frameworkTests.push(
      { id: 'extra-1', name: 'Extra 1', steps: [{ type: 'expectExists', selector: 'main' }] },
      { id: 'extra-2', name: 'Extra 2', steps: [{ type: 'expectExists', selector: 'main' }] },
    );

    expect(service.normalize(payload)).toBeNull();
  });

  it('rejects incomplete framework mappings and unsafe solution assets', () => {
    const missingFramework = validScenario();
    delete (missingFramework.supportedQuestions as any).vue;
    expect(service.normalize(missingFramework)).toBeNull();

    const unsafeAsset = validScenario();
    unsafeAsset.solutionAssets.react = 'https://example.com/solution.json';
    expect(service.normalize(unsafeAsset)).toBeNull();
  });
});

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
