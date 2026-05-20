import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { FrameworkPrepPathArticle } from './framework-prep-path-article.component';

describe('FrameworkPrepPathArticle', () => {
  let fixture: ComponentFixture<FrameworkPrepPathArticle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrameworkPrepPathArticle],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ slug: 'react-prep-path' }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FrameworkPrepPathArticle);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('renders React preparation intent, checklist links, plan choices, and prep FAQ copy', () => {
    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent || '';

    expect(text).toContain('How to Prepare for a React Interview: 7/14/30-Day Plan');
    expect(text).toContain('How to prepare for a React interview');
    expect(text).toContain('Use this checklist before choosing a timeline.');
    expect(text).toContain('React interview study plan: 7, 14, or 30 days');
    expect(text).toContain('React coding interview preparation drill');
    expect(text).toContain('senior React interview preparation');
    expect(text).toContain('7 days: refresh high-risk gaps');
    expect(text).toContain('14 days: make the loop repeatable');
    expect(text).toContain('30 days: build mock-ready depth');
    expect(text).toContain('How do I prepare for a React interview?');
    expect(text).toContain('What should I study first for a React interview?');
    expect(text).toContain('How long does it take to prepare for a React interview?');
    expect(text).toContain('How should I practice React coding interview questions?');
    expect(text).toContain('How do I prepare for a senior React interview?');

    expect(host.querySelector('a[href="/react/interview-questions"]')).toBeTruthy();
    expect(host.querySelector('a[href="/coding?tech=react&kind=trivia"]')).toBeTruthy();
    expect(host.querySelector('a[href="/coding?tech=react&kind=coding"]')).toBeTruthy();
  });
});
