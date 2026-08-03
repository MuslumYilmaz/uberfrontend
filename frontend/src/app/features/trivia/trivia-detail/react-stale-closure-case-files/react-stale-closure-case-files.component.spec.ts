import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import {
  REACT_STALE_CLOSURE_CASE_FILES,
  REACT_STALE_CLOSURE_CASE_IDS,
  REACT_STALE_CLOSURE_TRUST_NOTE,
  ReactStaleClosureCaseFile,
} from './react-stale-closure-case-files.content';
import { ReactStaleClosureCaseFilesComponent } from './react-stale-closure-case-files.component';

describe('ReactStaleClosureCaseFilesComponent', () => {
  let fixture: ComponentFixture<ReactStaleClosureCaseFilesComponent>;
  let component: ReactStaleClosureCaseFilesComponent;
  let analytics: jasmine.SpyObj<AnalyticsService>;

  const openedToggleEvent = {
    currentTarget: { open: true },
  } as unknown as Event;

  beforeEach(async () => {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);

    await TestBed.configureTestingModule({
      imports: [ReactStaleClosureCaseFilesComponent],
      providers: [{ provide: AnalyticsService, useValue: analytics }],
    }).compileComponents();

    fixture = TestBed.createComponent(ReactStaleClosureCaseFilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('renders the six stable fragment IDs with only the first case disclosure open', () => {
    const root = fixture.nativeElement as HTMLElement;
    const disclosures = Array.from(root.querySelectorAll('details.case-file'));

    expect(REACT_STALE_CLOSURE_CASE_IDS).toEqual([
      'pr-interval-counter',
      'pr-chat-theme',
      'pr-escape-listener',
      'pr-debounced-autosave',
      'pr-export-snapshot',
      'pr-search-ordering',
    ]);
    expect(new Set(REACT_STALE_CLOSURE_CASE_IDS).size).toBe(6);
    expect(disclosures.map((item) => item.id)).toEqual(REACT_STALE_CLOSURE_CASE_IDS as unknown as string[]);
    expect((disclosures[0] as HTMLDetailsElement).open).toBeTrue();
    expect(disclosures.slice(1).every((item) => !(item as HTMLDetailsElement).open)).toBeTrue();
  });

  it('keeps every verdict, minimal diff, and proof in the DOM for raw SSR', () => {
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent || '';
    const verdicts = root.querySelectorAll('details.case-file__result');

    expect(verdicts.length).toBe(6);
    expect(Array.from(verdicts).every((item) => item.querySelector('summary') !== null)).toBeTrue();
    expect(text).toContain('Use the functional state updater');
    expect(text).toContain('Use an Effect Event when React 19.2+ is available');
    expect(text).toContain('Name the snapshot to make intent reviewable');
    expect(text).toContain('Guard the commit with a request generation');
    expect(text).toContain("expect(screen.getByText('Count: 3'))");
    expect(text).toContain('Minimal code change');
    expect(
      Array.from(root.querySelectorAll('.case-file__diagnosis strong')).filter(
        (item) => item.textContent?.trim() === 'Common misdiagnosis',
      ).length,
    ).toBe(6);
    expect(root.querySelector('[hidden][data-testid$="-verdict"]')).toBeNull();
  });

  it('renders the callback-contract decision labels before the exact case-files heading', () => {
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent || '';
    const callbackHeading = root.querySelector('#callback-contract-title');
    const casesHeading = root.querySelector('#react-stale-closure-case-files-title');

    expect(callbackHeading?.textContent?.trim()).toBe('Callback contract');
    expect(casesHeading?.textContent?.trim()).toBe('React stale closure case files');
    expect(text).toContain('Previous state');
    expect(text).toContain('Re-synchronization');
    expect(text).toContain('Latest read');
    expect(text).toContain('Invocation snapshot');
    expect(text).toContain('Completion ordering');
  });

  it('uses native keyboard controls and updates prediction aria-pressed with the exact payload', () => {
    const root = fixture.nativeElement as HTMLElement;
    const prediction = root.querySelector(
      '[data-testid="pr-interval-counter-prediction-count-one"]',
    ) as HTMLButtonElement;

    expect(prediction.tagName).toBe('BUTTON');
    expect(prediction.getAttribute('aria-pressed')).toBe('false');
    expect(root.querySelector('summary.case-file__summary')?.tagName).toBe('SUMMARY');
    expect(root.querySelector('[role="tab"]')).toBeNull();

    prediction.click();
    fixture.detectChanges();

    expect(prediction.getAttribute('aria-pressed')).toBe('true');
    expect(component.predictionIsCorrect(REACT_STALE_CLOSURE_CASE_FILES[0])).toBeTrue();
    expect(analytics.track).toHaveBeenCalledWith('trivia_case_file_interacted', {
      topic: 'react_stale_closures',
      action: 'prediction_answered',
      case_id: 'pr-interval-counter',
      prediction: 'count-one',
      correct: true,
    });
  });

  it('does not emit a case-selection event for the default SSR-open disclosure', () => {
    expect(analytics.track).not.toHaveBeenCalled();
  });

  it('tracks a user opening an outer disclosure and ignores a closing activation', () => {
    analytics.track.calls.reset();
    component.onCaseSummaryActivated(
      'pr-chat-theme',
      { currentTarget: { parentElement: { open: true } } } as unknown as Event,
    );
    expect(analytics.track).not.toHaveBeenCalled();

    component.onCaseSummaryActivated(
      'pr-chat-theme',
      { currentTarget: { parentElement: { open: false } } } as unknown as Event,
    );

    expect(analytics.track).toHaveBeenCalledOnceWith('trivia_case_file_interacted', {
      topic: 'react_stale_closures',
      action: 'case_selected',
      case_id: 'pr-chat-theme',
    });
  });

  it('tracks the selected contract and whether it satisfies the case contract', () => {
    const root = fixture.nativeElement as HTMLElement;
    const contract = root.querySelector(
      '[data-testid="pr-search-ordering-contract-request-ordering"]',
    ) as HTMLButtonElement;

    contract.click();
    fixture.detectChanges();

    expect(contract.getAttribute('aria-pressed')).toBe('true');
    expect(analytics.track).toHaveBeenCalledWith('trivia_case_file_interacted', {
      topic: 'react_stale_closures',
      action: 'contract_selected',
      case_id: 'pr-search-ordering',
      contract: 'request-ordering',
      correct: true,
    });
  });

  it('tracks native verdict disclosures and emits completed exactly once', () => {
    analytics.track.calls.reset();

    REACT_STALE_CLOSURE_CASE_FILES.forEach((caseFile) => {
      component.onVerdictToggle(caseFile, openedToggleEvent);
    });
    component.onVerdictToggle(REACT_STALE_CLOSURE_CASE_FILES[0], openedToggleEvent);

    const verdictCalls = analytics.track.calls.allArgs().filter(
      ([, payload]) => payload?.['action'] === 'verdict_revealed',
    );
    const completedCalls = analytics.track.calls.allArgs().filter(
      ([, payload]) => payload?.['action'] === 'completed',
    );

    expect(verdictCalls.length).toBe(7);
    expect(verdictCalls[0]).toEqual([
      'trivia_case_file_interacted',
      {
        topic: 'react_stale_closures',
        action: 'verdict_revealed',
        case_id: 'pr-interval-counter',
      },
    ]);
    expect(completedCalls).toEqual([
      [
        'trivia_case_file_interacted',
        { topic: 'react_stale_closures', action: 'completed' },
      ],
    ]);
    expect(component.revealedCaseIds().size).toBe(6);
  });

  it('copies a prescription with its proof and emits the stable event payload', async () => {
    const caseFile = REACT_STALE_CLOSURE_CASE_FILES[0];
    const copyText = spyOn(component as any, 'copyText').and.resolveTo(true);

    await component.copyPrescription(caseFile);

    expect(copyText).toHaveBeenCalledWith(jasmine.stringContaining(caseFile.afterCode));
    expect(copyText).toHaveBeenCalledWith(jasmine.stringContaining(caseFile.proofAssertion));
    expect(analytics.track).toHaveBeenCalledWith('trivia_case_file_interacted', {
      topic: 'react_stale_closures',
      action: 'prescription_copied',
      case_id: 'pr-interval-counter',
    });
  });

  it('falls back to a temporary textarea when the Clipboard API is unavailable', () => {
    const execCommand = spyOn(document, 'execCommand').and.returnValue(true);

    const copied = (component as any).copyWithTextarea('fallback prescription') as boolean;

    expect(copied).toBeTrue();
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(document.body.querySelector('textarea')).toBeNull();
  });

  it('distinguishes intentional snapshots and request races from stale closures', () => {
    const exportCase = findCase('pr-export-snapshot');
    const searchCase = findCase('pr-search-ordering');

    expect(exportCase.diagnosis).toContain('not a stale-closure bug');
    expect(exportCase.correctContractId).toBe('intentional-snapshot');
    expect(searchCase.diagnosis).toContain('race condition, not a stale closure');
    expect(searchCase.correctContractId).toBe('request-ordering');
  });

  it('labels every common misdiagnosis and keeps the chat diagnosis technically precise', () => {
    const chatCase = findCase('pr-chat-theme');

    expect(REACT_STALE_CLOSURE_CASE_FILES.every((item) => item.commonMisdiagnosis.trim().length > 0))
      .toBeTrue();
    expect(chatCase.diagnosis).toContain('over-synchronized, not currently stale');
    expect(chatCase.diagnosis).not.toContain('The closure is stale');
  });

  it('cancels pending debounced autosave work during unmount', () => {
    const autosaveCase = findCase('pr-debounced-autosave');

    expect(autosaveCase.afterCode).toContain('saveLater.cancel()');
    expect(autosaveCase.proofAssertion).toContain('unmount();');
    expect(autosaveCase.proofAssertion).toContain(
      "expect(onSave).not.toHaveBeenCalledWith('draft C');",
    );
  });

  it('documents the React 19.2 boundary and a ref-pure React 18 fallback', () => {
    const chatCase = findCase('pr-chat-theme');

    expect(chatCase.compatibilityNote).toContain('React 19.2+');
    expect(chatCase.fallbackCode).toContain('useEffect(() => {\n  latestTheme.current = theme;');
    expect(chatCase.fallbackCode).not.toContain('const latestTheme = useRef(theme);\nlatestTheme.current');
  });

  it('uses one polite live region, exact trust copy, and a reduced-motion override', () => {
    const root = fixture.nativeElement as HTMLElement;
    const styleText = Array.from(document.querySelectorAll('style'))
      .map((style) => style.textContent || '')
      .join('\n');

    expect(root.querySelectorAll('[aria-live="polite"]').length).toBe(1);
    expect(root.textContent).toContain(REACT_STALE_CLOSURE_TRUST_NOTE);
    expect(root.textContent).toContain('They do not mount React, start timers');
    expect(styleText).toContain('prefers-reduced-motion: reduce');
    expect(styleText).toContain('.case-file__result-chevron');
  });

  function findCase(id: string): ReactStaleClosureCaseFile {
    const caseFile = REACT_STALE_CLOSURE_CASE_FILES.find((item) => item.id === id);
    if (!caseFile) {
      throw new Error(`Missing case fixture: ${id}`);
    }
    return caseFile;
  }
});
