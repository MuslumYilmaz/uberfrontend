import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SystemDesignRadioFrameworkArticle } from './system-design-radio-framework';

describe('SystemDesignRadioFrameworkArticle', () => {
  let fixture: ComponentFixture<SystemDesignRadioFrameworkArticle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemDesignRadioFrameworkArticle],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemDesignRadioFrameworkArticle);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('renders the RADIO method as a frontend system design interview framework', () => {
    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent || '';

    expect(text).toContain('Frontend System Design Interview Framework: RADIO Method');
    expect(text).toContain('frontend system design interview framework');
    expect(text).toContain('45-minute interview flow');
    expect(text).toContain('What is the RADIO framework for frontend system design interviews?');
    expect(text).toContain('How do I use RADIO to answer a frontend system design interview question?');
    expect(text).toContain('What should I cover in Requirements, Architecture, Data, Interface, and Optimizations?');
    expect(text).toContain('How does RADIO work in a 45-minute system design interview?');
    expect(text).toContain('Is RADIO only for frontend system design?');

    expect(text).toContain('Requirements');
    expect(text).toContain('Architecture');
    expect(text).toContain('Data');
    expect(text).toContain('Interface');
    expect(text).toContain('Optimizations');
    expect(host.querySelectorAll('.radio-flow-step').length).toBe(5);
  });
});
