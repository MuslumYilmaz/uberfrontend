import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FaQuestionRowComponent, FaQuestionRowVariant } from './fa-question-row.component';

describe('FaQuestionRowComponent', () => {
  async function createComponent() {
    await TestBed.configureTestingModule({
      imports: [FaQuestionRowComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(FaQuestionRowComponent);
    fixture.componentRef.setInput('testId', 'question-card-demo');
    fixture.componentRef.setInput('kindLabel', 'Concept');
    fixture.componentRef.setInput('title', 'What are callbacks?');
    fixture.componentRef.setInput('description', 'Explain inversion of control.');
    fixture.componentRef.setInput('routerLink', ['/javascript', 'trivia', 'demo']);
    fixture.componentRef.setInput('solved', true);
    fixture.componentRef.setInput('companies', ['google', 'meta']);
    fixture.componentRef.setInput('metaChips', [
      { label: 'Easy', ariaLabel: 'Difficulty: Easy', tone: 'difficulty' },
      { label: 'JavaScript', ariaLabel: 'Technology: JavaScript', tone: 'tech' },
    ]);
    fixture.componentRef.setInput('variants', [
      { id: 'react-demo', label: 'React', active: true, ariaLabel: 'Open React version' },
      { id: 'vue-demo', label: 'Vue', ariaLabel: 'Open Vue version' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    return fixture;
  }

  it('renders a navigable dense row with key signals and metadata', async () => {
    const fixture = await createComponent();
    const host = fixture.nativeElement as HTMLElement;
    const row = host.querySelector('[data-testid="question-card-demo"]') as HTMLAnchorElement;

    expect(row).not.toBeNull();
    expect(row.getAttribute('href')).toBe('/javascript/trivia/demo');
    expect(row.textContent || '').toContain('Concept');
    expect(row.textContent || '').toContain('What are callbacks?');
    expect(row.querySelector('[data-testid="question-row-title-question-card-demo"]')?.textContent || '').toContain(
      'What are callbacks?',
    );
    expect(row.textContent || '').toContain('Explain inversion of control.');
    expect(row.querySelector('[data-testid="question-card-solved-mark-demo"]')).not.toBeNull();
    expect(row.querySelector('[data-testid="company-signal-google"]')?.getAttribute('aria-label')).toBe(
      'Company prep signal: Google and 1 more',
    );
    expect(row.querySelector('[aria-label="Difficulty: Easy"]')?.textContent || '').toContain('Easy');
    expect(row.querySelector('[aria-label="Technology: JavaScript"]')?.textContent || '').toContain('JavaScript');
  });

  it('emits variant selections without emitting a row click', async () => {
    const fixture = await createComponent();
    const component = fixture.componentInstance;
    const rowClickSpy = jasmine.createSpy('rowClick');
    const variantSpy = jasmine.createSpy('variantSelected');
    component.rowClick.subscribe(rowClickSpy);
    component.variantSelected.subscribe(variantSpy);

    const host = fixture.nativeElement as HTMLElement;
    const vueButton = host.querySelector('[data-testid="question-row-variant-vue-demo"]') as HTMLButtonElement;
    vueButton.click();
    fixture.detectChanges();

    expect(rowClickSpy).not.toHaveBeenCalled();
    expect(variantSpy).toHaveBeenCalledOnceWith(
      jasmine.objectContaining<FaQuestionRowVariant>({ id: 'vue-demo', label: 'Vue' }),
    );
  });

  it('renders read-only rows without a chevron when no route is provided', async () => {
    await TestBed.configureTestingModule({
      imports: [FaQuestionRowComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(FaQuestionRowComponent);
    fixture.componentRef.setInput('testId', 'company-preview-question-demo');
    fixture.componentRef.setInput('title', 'Preview question');
    fixture.componentRef.setInput('description', 'Read-only preview.');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const row = host.querySelector('[data-testid="company-preview-question-demo"]') as HTMLElement;
    expect(row.tagName.toLowerCase()).toBe('div');
    expect(row.querySelector('.fa-question-row__chevron')).toBeNull();
  });

  it('keeps secondary metadata accessible without rendering another visible chip', async () => {
    const fixture = await createComponent();
    fixture.componentRef.setInput('metaChips', [
      { label: '93/100', ariaLabel: 'Importance score 93 out of 100', tone: 'score' },
      {
        label: 'JS functions',
        ariaLabel: 'Section: JavaScript functions',
        tone: 'neutral',
        priority: 'secondary',
      },
    ]);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const meta = host.querySelector('.fa-question-row__meta') as HTMLElement;

    expect(meta.querySelector('[aria-label="Importance score 93 out of 100"]')?.textContent || '').toContain(
      '93/100',
    );
    expect(meta.querySelector('.fa-question-row__meta-chip[aria-label="Section: JavaScript functions"]')).toBeNull();
    expect(meta.getAttribute('aria-label')).toBe('Question metadata');
    expect(meta.querySelector('.fa-question-row__sr-meta')?.textContent || '').toContain(
      'Section: JavaScript functions',
    );
  });

  it('keeps long titles readable while letting metadata wrap', async () => {
    const fixture = await createComponent();
    fixture.componentRef.setInput(
      'title',
      'Concurrency-Limited Map (ordered results with cancellation and stale request handling)',
    );
    fixture.componentRef.setInput('metaChips', [
      { label: 'JS functions', ariaLabel: 'Section: JavaScript functions', tone: 'neutral' },
      { label: 'Must know', ariaLabel: 'Tier: Must know', tone: 'tier' },
      { label: '88/100', ariaLabel: 'Importance score 88 out of 100', tone: 'score' },
      { label: 'Hard', ariaLabel: 'Difficulty: Hard', tone: 'difficulty' },
      { label: 'JavaScript', ariaLabel: 'Technology: JavaScript', tone: 'tech' },
      { label: 'Premium', ariaLabel: 'Premium question', tone: 'access' },
    ]);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const row = host.querySelector('[data-testid="question-card-demo"]') as HTMLElement;
    const title = host.querySelector('.fa-question-row__title') as HTMLElement;
    const meta = host.querySelector('.fa-question-row__meta') as HTMLElement;

    expect(getComputedStyle(row).minHeight).toBe('108px');
    expect(getComputedStyle(title).whiteSpace).toBe('normal');
    expect(getComputedStyle(title).getPropertyValue('-webkit-line-clamp')).toBe('2');
    expect(getComputedStyle(meta).minWidth).toBe('0px');
    expect(getComputedStyle(meta).flexWrap).toBe('wrap');
  });
});
