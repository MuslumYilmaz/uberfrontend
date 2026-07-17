import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import {
  PressureModeDebrief,
  PressureModeFramework,
  PressureModeRound,
  PressureModeScenario,
} from '../models/pressure-mode.model';
import { FrameworkTest, FrameworkTestStep, FrameworkTestStepType } from '../models/question.model';
import { normalizeAssetPath } from '../utils/asset-url.util';
import { PracticeAssetResolverService } from './practice-asset-resolver.service';

const FRAMEWORKS: PressureModeFramework[] = ['react', 'angular', 'vue'];
const FRAMEWORK_STEP_TYPES = new Set<FrameworkTestStepType>([
  'expectExists',
  'expectText',
  'expectNoText',
  'expectDisabled',
  'click',
  'mouseDown',
  'pointerDown',
  'wait',
  'waitForText',
  'setValue',
  'expectValue',
  'expectFocused',
  'expectCount',
  'waitForCount',
  'expectAttribute',
  'expectClass',
  'key',
  'unmountPreview',
  'expectNoPreviewTimers',
  'expectNoPreviewLeaks',
]);

@Injectable({ providedIn: 'root' })
export class PressureModeService {
  private readonly http = inject(HttpClient);
  private readonly assets = inject(PracticeAssetResolverService);
  private readonly cache = new Map<string, Observable<PressureModeScenario | null>>();

  load(assetPathRaw: string): Observable<PressureModeScenario | null> {
    const assetPath = normalizeAssetPath(assetPathRaw);
    if (!/^assets\/questions\/pressure-modes\/[a-z0-9.-]+\.json$/i.test(assetPath)) {
      return of(null);
    }

    const cached = this.cache.get(assetPath);
    if (cached) return cached;

    const request$ = this.assets.getVersion().pipe(
      switchMap((version) => {
        const { primary, fallback } = this.assets.getAssetUrls(assetPath, version);
        return primary !== fallback
          ? this.http.get<unknown>(primary).pipe(catchError(() => this.http.get<unknown>(fallback)))
          : this.http.get<unknown>(fallback);
      }),
      map((payload) => this.normalize(payload)),
      catchError(() => of(null)),
      shareReplay(1),
    );

    this.cache.set(assetPath, request$);
    return request$;
  }

  normalize(payload: unknown): PressureModeScenario | null {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
    const source = payload as Record<string, unknown>;
    const schemaVersion = this.text(source['schemaVersion']);
    const id = this.text(source['id']);
    const family = this.text(source['family']);
    const title = this.text(source['title']);
    const access = source['access'] === 'premium' ? 'premium' : source['access'] === 'free' ? 'free' : null;
    const estimatedMinutes = Number(source['estimatedMinutes']);
    const supportedQuestions = this.normalizeFrameworkMap(source['supportedQuestions']);
    const solutionAssets = this.normalizeFrameworkMap(source['solutionAssets'], true);
    const rounds = Array.isArray(source['rounds'])
      ? source['rounds']
        .map((round) => this.normalizeRound(round))
        .filter((round): round is PressureModeRound => round !== null)
      : [];
    const debrief = this.normalizeDebrief(source['debrief']);

    if (!schemaVersion || !id || !family || !title || !access) return null;
    if (!Number.isFinite(estimatedMinutes) || estimatedMinutes <= 0) return null;
    if (!supportedQuestions || !solutionAssets || !debrief) return null;
    if (!rounds.length || rounds.length > 6) return null;
    if (new Set(rounds.map((round) => round.id)).size !== rounds.length) return null;

    const totalChecks = rounds.reduce((total, round) => total + round.frameworkTests.length, 0);
    if (totalChecks === 0 || totalChecks > 6) return null;

    return {
      schemaVersion,
      id,
      family,
      title,
      access,
      estimatedMinutes,
      supportedQuestions,
      rounds,
      debrief,
      solutionAssets,
    };
  }

  private normalizeRound(value: unknown): PressureModeRound | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const source = value as Record<string, unknown>;
    const id = this.text(source['id']);
    const title = this.text(source['title']);
    const interviewerPrompt = this.text(source['interviewerPrompt']);
    const constraints = this.stringList(source['constraints']);
    const frameworkTests = Array.isArray(source['frameworkTests'])
      ? source['frameworkTests']
        .map((test, index) => this.normalizeFrameworkTest(test, index))
        .filter((test): test is FrameworkTest => test !== null)
      : [];

    if (!id || !title || !interviewerPrompt || !constraints.length || !frameworkTests.length) {
      return null;
    }

    return { id, title, interviewerPrompt, constraints, frameworkTests };
  }

  private normalizeFrameworkTest(value: unknown, index: number): FrameworkTest | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const source = value as Record<string, unknown>;
    const id = this.text(source['id']) || `pressure-check-${index + 1}`;
    const name = this.text(source['name']) || id;
    const steps = Array.isArray(source['steps'])
      ? source['steps']
        .map((step) => this.normalizeStep(step))
        .filter((step): step is FrameworkTestStep => step !== null)
      : [];
    return steps.length ? { id, name, steps } : null;
  }

  private normalizeStep(value: unknown): FrameworkTestStep | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const source = value as Record<string, unknown>;
    const rawType = this.text(source['type'] || source['action']) as FrameworkTestStepType;
    if (!FRAMEWORK_STEP_TYPES.has(rawType)) return null;

    const step: FrameworkTestStep = { type: rawType };
    for (const key of [
      'selector',
      'text',
      'match',
      'value',
      'key',
      'attribute',
      'className',
    ] as const) {
      if (typeof source[key] === 'string') {
        (step as Record<string, unknown>)[key] = source[key];
      }
    }
    for (const key of ['index', 'timeoutMs', 'durationMs', 'count'] as const) {
      if (typeof source[key] === 'number' && Number.isFinite(source[key])) {
        (step as Record<string, unknown>)[key] = source[key];
      }
    }
    if (typeof source['disabled'] === 'boolean') step.disabled = source['disabled'];
    if (
      typeof source['expected'] === 'string'
      || typeof source['expected'] === 'number'
      || typeof source['expected'] === 'boolean'
    ) {
      step.expected = source['expected'];
    }
    return step;
  }

  private normalizeDebrief(value: unknown): PressureModeDebrief | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const source = value as Record<string, unknown>;
    const title = this.text(source['title']);
    const summary = this.text(source['summary']);
    const takeaways = this.stringList(source['takeaways']);
    const frameworkNotes = this.normalizeFrameworkMap(source['frameworkNotes']);
    if (!title || !summary || !takeaways.length || !frameworkNotes) return null;
    return { title, summary, takeaways, frameworkNotes };
  }

  private normalizeFrameworkMap(
    value: unknown,
    requireAssetPath = false,
  ): Record<PressureModeFramework, string> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const source = value as Record<string, unknown>;
    const normalized = {} as Record<PressureModeFramework, string>;
    for (const framework of FRAMEWORKS) {
      const text = this.text(source[framework]);
      if (!text) return null;
      if (requireAssetPath && !new RegExp(`^assets/sb/${framework}/solution/[a-z0-9.-]+\\.json$`, 'i').test(text)) {
        return null;
      }
      normalized[framework] = text;
    }
    return normalized;
  }

  private stringList(value: unknown): string[] {
    return Array.isArray(value)
      ? value.map((item) => this.text(item)).filter(Boolean)
      : [];
  }

  private text(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }
}
