import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { OfflineService } from '../../../core/services/offline';
import { SeoService } from '../../../core/services/seo.service';
import { GuideDetailResolved } from '../../../core/resolvers/guide-detail.resolver';
import { SystemDesignHostComponent } from './system-design-host.component';

@Component({
  standalone: true,
  template: '<h1 class="article-title">Resolved guide article</h1>',
})
class ResolvedGuideStubComponent {}

describe('SystemDesignHostComponent', () => {
  let seo: jasmine.SpyObj<SeoService>;
  let router: jasmine.SpyObj<Router>;

  async function createComponent(data: Record<string, unknown>): Promise<ComponentFixture<SystemDesignHostComponent>> {
    seo = jasmine.createSpyObj<SeoService>('SeoService', ['updateTags', 'buildCanonicalUrl']);
    seo.buildCanonicalUrl.and.callFake((value: string) => `https://frontendatlas.com${value}`);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl'], {
      url: '/guides/system-design-blueprint/pitfalls',
    });

    await TestBed.configureTestingModule({
      imports: [SystemDesignHostComponent, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: {
          data: of(data),
          snapshot: {
            data,
            paramMap: convertToParamMap({ slug: 'pitfalls' }),
          },
        } },
        { provide: SeoService, useValue: seo },
        { provide: Router, useValue: router },
        { provide: OfflineService, useValue: { isOnline: () => true } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SystemDesignHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('does not render the browser fallback heading before guide data arrives', async () => {
    const fixture = await createComponent({});
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.guide-ssr-shell')).toBeNull();
  });

  it('removes the fallback heading after creating the resolved guide article', async () => {
    const guideDetail: GuideDetailResolved = {
      slug: 'pitfalls',
      entry: {} as GuideDetailResolved['entry'],
      component: ResolvedGuideStubComponent,
    };
    const fixture = await createComponent({ guideDetail });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.guide-ssr-shell')).toBeNull();
    expect(host.querySelector('.article-title')?.textContent).toContain('Resolved guide article');
    expect(host.querySelectorAll('h1').length).toBe(1);
  });
});
