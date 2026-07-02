import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ReplaySubject } from 'rxjs';
import { GuideDetailResolved } from '../../../core/resolvers/guide-detail.resolver';
import { OfflineService } from '../../../core/services/offline';
import { SeoService } from '../../../core/services/seo.service';
import { BehavioralHostComponent } from './behavioral-host.component';

@Component({
  standalone: true,
  template: '<h1 class="article-title">Resolved behavioral article</h1>',
})
class ResolvedBehavioralGuideStubComponent {}

describe('BehavioralHostComponent', () => {
  let seo: jasmine.SpyObj<SeoService>;
  let router: jasmine.SpyObj<Router>;

  async function createDynamicComponent(
    data: Record<string, unknown> = {},
    slug = 'intro',
  ): Promise<{
    fixture: ComponentFixture<BehavioralHostComponent>;
    routeData$: ReplaySubject<Record<string, unknown>>;
  }> {
    const routeData$ = new ReplaySubject<Record<string, unknown>>(1);
    seo = jasmine.createSpyObj<SeoService>('SeoService', ['updateTags', 'buildCanonicalUrl']);
    seo.buildCanonicalUrl.and.callFake((value: string) => `https://frontendatlas.com${value}`);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl'], {
      url: `/guides/behavioral/${slug}`,
    });

    await TestBed.configureTestingModule({
      imports: [BehavioralHostComponent, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: {
          data: routeData$.asObservable(),
          snapshot: {
            data,
            paramMap: convertToParamMap({ slug }),
          },
        } },
        { provide: SeoService, useValue: seo },
        { provide: Router, useValue: router },
        { provide: OfflineService, useValue: { isOnline: () => true } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(BehavioralHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, routeData$ };
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('removes a stale prerender fallback heading when the resolved guide article hydrates', async () => {
    const { fixture, routeData$ } = await createDynamicComponent({}, 'intro');
    const host = fixture.nativeElement as HTMLElement;
    const staleShell = document.createElement('section');
    staleShell.className = 'guide-ssr-shell';
    staleShell.innerHTML = '<h1 class="guide-ssr-shell__title">Behavioral Interview Blueprint</h1>';
    host.insertBefore(staleShell, host.firstChild);

    routeData$.next({
      guideDetail: {
        slug: 'intro',
        entry: {} as GuideDetailResolved['entry'],
        component: ResolvedBehavioralGuideStubComponent,
      } satisfies GuideDetailResolved,
    });
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();

    expect(host.querySelector('.guide-ssr-shell')).toBeNull();
    expect(host.querySelector('.article-title')?.textContent).toContain('Resolved behavioral article');
    expect(host.querySelectorAll('h1').length).toBe(1);
  });
});
