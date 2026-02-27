import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TrackListComponent } from './track-list.component';

describe('TrackListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackListComponent, RouterTestingModule],
    }).compileComponents();
  });

  it('renders crawlable interview hub links in the hero section', async () => {
    const fixture = TestBed.createComponent(TrackListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const native = fixture.nativeElement as HTMLElement;
    const masterHub = native.querySelector('a[href="/interview-questions"]');
    const reactHub = native.querySelector('a[href="/react/interview-questions"]');
    const angularHub = native.querySelector('a[href="/angular/interview-questions"]');
    const vueHub = native.querySelector('a[href="/vue/interview-questions"]');
    const htmlHub = native.querySelector('a[href="/html/interview-questions"]');
    const cssHub = native.querySelector('a[href="/css/interview-questions"]');
    const htmlCssHub = native.querySelector('a[href="/html-css/interview-questions"]');

    expect(masterHub).toBeTruthy();
    expect(reactHub).toBeTruthy();
    expect(angularHub).toBeTruthy();
    expect(vueHub).toBeTruthy();
    expect(htmlHub).toBeTruthy();
    expect(cssHub).toBeTruthy();
    expect(htmlCssHub).toBeTruthy();
  });

  it('keeps interview question hubs in prep sequence ordering', () => {
    const fixture = TestBed.createComponent(TrackListComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const hubStep = component.trackPrepSequence.find(
      (entry) => typeof entry === 'object' && entry?.route?.[0] === '/interview-questions',
    ) as { text?: string } | undefined;

    expect(hubStep).toBeTruthy();
    expect(hubStep?.text).toContain('Interview question hubs');
  });
});
