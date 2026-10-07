import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, convertToParamMap } from '@angular/router';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { TradeoffBattleScenario } from '../models/tradeoff-battle.model';
import { SeoService } from '../services/seo.service';
import { TradeoffBattleService } from '../services/tradeoff-battle.service';
import { TRADEOFF_DETAIL_FALLBACK_SEO } from '../utils/tradeoff-seo.util';
import { TradeoffBattleDetailResolved, tradeoffBattleDetailResolver } from './tradeoff-battle.resolver';

describe('tradeoffBattleDetailResolver', () => {
  let tradeoffs: jasmine.SpyObj<TradeoffBattleService>;

  const scenario: TradeoffBattleScenario = {
    meta: {
      id: 'context-vs-zustand-vs-redux',
      title: 'Context vs Zustand vs Redux for a growing React dashboard',
      tech: 'react',
      difficulty: 'intermediate',
      summary: 'Choose state ownership from update frequency and product complexity.',
      tags: ['react', 'state management'],
      access: 'free',
      estimatedMinutes: 14,
      updatedAt: '2026-10-01',
    },
    scenario: 'A dashboard needs shared state.',
    prompt: 'Choose the best state-management approach.',
    options: [
      {
        id: 'zustand',
        label: 'Zustand',
        summary: 'A small external store.',
        whenItWins: ['The state surface is growing.'],
        watchOutFor: ['Keep conventions explicit.'],
      },
    ],
    decisionMatrix: [],
    evaluationDimensions: [
      { id: 'scope', title: 'State scope', description: 'How broadly the state is shared.' },
    ],
    strongAnswer: {
      title: 'Choose based on constraints',
      summary: 'State scope determines the choice.',
      reasoning: ['Start from update frequency.'],
    },
    interviewerPushback: [],
    answerExamples: [],
    answerFramework: ['Start from the product constraint.'],
    antiPatterns: [],
  };

  const route = (id: string): ActivatedRouteSnapshot => ({
    paramMap: convertToParamMap({ id }),
  } as ActivatedRouteSnapshot);

  const resolve = (id: string): Promise<TradeoffBattleDetailResolved> => {
    const result = TestBed.runInInjectionContext(() =>
      tradeoffBattleDetailResolver(route(id), {} as RouterStateSnapshot),
    ) as Observable<TradeoffBattleDetailResolved>;
    return firstValueFrom(result);
  };

  beforeEach(() => {
    tradeoffs = jasmine.createSpyObj<TradeoffBattleService>('TradeoffBattleService', [
      'loadIndex',
      'loadScenario',
    ]);
    TestBed.configureTestingModule({
      providers: [
        { provide: TradeoffBattleService, useValue: tradeoffs },
        {
          provide: SeoService,
          useValue: {
            buildCanonicalUrl: (value: string) => `https://frontendatlas.com${value}`,
          },
        },
      ],
    });
  });

  it('returns the detail-specific SEO payload with the resolved battle', async () => {
    tradeoffs.loadIndex.and.returnValue(of([scenario.meta]));
    tradeoffs.loadScenario.and.returnValue(of(scenario));

    const result = await resolve(scenario.meta.id);

    expect(result.seo.title).toBe(
      'Context vs Zustand vs Redux for a growing React dashboard - React Tradeoff Question',
    );
    expect(result.seo.description).toContain('Practice this react tradeoff interview question.');
    expect(result.seo.canonical).toBe('/tradeoffs/context-vs-zustand-vs-redux');
  });

  it('returns a noindex SEO payload when loading the detail fails', async () => {
    tradeoffs.loadIndex.and.returnValue(of([scenario.meta]));
    tradeoffs.loadScenario.and.returnValue(throwError(() => new Error('asset unavailable')));

    const result = await resolve(scenario.meta.id);

    expect(result.battle).toBeNull();
    expect(result.seo).toEqual(jasmine.objectContaining({
      title: TRADEOFF_DETAIL_FALLBACK_SEO.title,
      description: TRADEOFF_DETAIL_FALLBACK_SEO.description,
      canonical: '/tradeoffs/context-vs-zustand-vs-redux',
      robots: 'noindex,follow',
    }));
  });
});
