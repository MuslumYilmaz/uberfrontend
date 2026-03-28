import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  IncidentDetailResolved,
} from '../../../core/resolvers/incident.resolver';
import {
  IncidentListItem,
  IncidentPriorityOrderStage,
  IncidentProgressRecord,
  IncidentRelatedPractice,
  IncidentScenario,
  IncidentStage,
  createEmptyIncidentProgressRecord,
} from '../../../core/models/incident.model';
import {
  IncidentAttemptEvaluation,
  IncidentStageEvaluation,
  evaluateIncidentAttempt,
  evaluateIncidentStage,
} from '../../../core/utils/incident-scoring.util';
import { IncidentProgressService } from '../../../core/services/incident-progress.service';
import { SeoService } from '../../../core/services/seo.service';
import { ActivityService } from '../../../core/services/activity.service';
import { AuthService } from '../../../core/services/auth.service';
import { BugReportService } from '../../../core/services/bug-report.service';
import { buildIncidentSeoMeta, incidentTechLabel } from '../../../core/utils/incident-seo.util';
import { LockedPreviewData } from '../../../core/utils/locked-preview.util';
import { LockedPreviewComponent } from '../../../shared/components/locked-preview/locked-preview.component';
import { frameworkFromTech, freeChallengeForFramework } from '../../../core/utils/onboarding-personalization.util';
import { isProActive } from '../../../core/utils/entitlements.util';

type FeedbackStatus = 'correct' | 'partial' | 'review';
type LockedPath = {
  id: string;
  label: string;
  route: any[];
  queryParams?: Record<string, string>;
};

function normalizePreviewText(value: string): string {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function trimWords(value: string, maxWords: number): string {
  const normalized = normalizePreviewText(value);
  if (!normalized) return '';
  const words = normalized.split(/\s+/);
  if (words.length <= maxWords) return normalized;
  return `${words.slice(0, maxWords).join(' ')}…`;
}

function updatedLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function buildIncidentLockedPreview(
  scenario: IncidentScenario,
  candidates: IncidentListItem[],
): LockedPreviewData {
  const techLabel = incidentTechLabel(scenario.meta.tech);
  const evidenceSnippet = scenario.context.evidence.find((item) => item.type === 'snippet');
  const related = candidates
    .filter((item) => item.id !== scenario.meta.id && item.tech === scenario.meta.tech)
    .slice(0, 4)
    .map((item) => ({
      title: item.title,
      to: ['/incidents', item.id],
      premium: item.access === 'premium',
    }));

  return {
    what: `This premium ${techLabel} debug scenario focuses on ${scenario.meta.title}. Read the failure signals, choose the highest-signal debug order, and defend the fix plus regression guard.`,
    keyDecisions: [
      'Separate symptom from root cause before touching code.',
      'Choose the smallest debug step that removes the most ambiguity.',
      'Prefer a durable fix over a UI-only patch.',
      'Define the regression guard you would add after the fix.',
    ],
    rubric: [
      'Strong answers prioritize evidence instead of guessing.',
      'Good debug order reduces search space quickly.',
      'The final fix should match the actual failure mode.',
      'A senior answer closes with a guardrail or test plan.',
    ],
    learningGoals: scenario.stages
      .map((stage) => trimWords(stage.prompt || stage.title, 14))
      .filter(Boolean)
      .slice(0, 4),
    constraints: [
      trimWords(scenario.context.environment, 16),
      ...scenario.meta.signals.slice(0, 3).map((signal) => trimWords(signal, 16)),
    ].filter(Boolean),
    snippet: evidenceSnippet
      ? {
          title: evidenceSnippet.title,
          language: evidenceSnippet.language,
          lines: String(evidenceSnippet.body || '').split('\n').slice(0, 8),
        }
      : {
          title: 'Failure signals',
          lines: scenario.meta.signals.slice(0, 4).map((signal) => `- ${signal}`),
        },
    pitfalls: [
      'Jumping to the fix before proving the root cause.',
      'Treating every symptom as equally important.',
      'Stopping at the first plausible explanation.',
      'Skipping the regression guard after the fix.',
    ],
    related,
  };
}

@Component({
  standalone: true,
  selector: 'app-incident-detail',
  imports: [CommonModule, FormsModule, RouterModule, LockedPreviewComponent],
  templateUrl: './incident-detail.component.html',
  styleUrls: ['./incident-detail.component.css'],
})
export class IncidentDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seo = inject(SeoService);
  private readonly activity = inject(ActivityService);
  readonly auth = inject(AuthService);
  private readonly bugReport = inject(BugReportService);
  readonly progress = inject(IncidentProgressService);

  readonly incident = signal<IncidentScenario | null>(null);
  readonly incidentList = signal<IncidentListItem[]>([]);
  readonly prevIncident = signal<IncidentListItem | null>(null);
  readonly nextIncident = signal<IncidentListItem | null>(null);
  readonly activeStepIndex = signal(0);
  readonly answers = signal<Record<string, string | string[]>>({});
  readonly submittedStageIds = signal<string[]>([]);
  readonly stageResults = signal<Record<string, IncidentStageEvaluation>>({});
  readonly reflectionNote = signal('');

  readonly stages = computed(() => this.incident()?.stages ?? []);
  readonly debriefStepIndex = computed(() => this.stages().length + 1);
  readonly allStagesSubmitted = computed(() => this.submittedStageIds().length === this.stages().length);
  readonly currentStage = computed(() => {
    const index = this.activeStepIndex();
    const list = this.stages();
    if (index < 1 || index > list.length) return null;
    return list[index - 1] ?? null;
  });
  readonly attemptEvaluation = computed<IncidentAttemptEvaluation>(() =>
    evaluateIncidentAttempt(this.stages(), this.answers()),
  );
  readonly currentFeedback = computed(() => {
    const stage = this.currentStage();
    if (!stage) return null;
    return this.stageResults()[stage.id] ?? null;
  });
  readonly progressRecord = computed<IncidentProgressRecord>(() => {
    const meta = this.incident()?.meta;
    return meta ? this.progress.getRecord(meta.id) : createEmptyIncidentProgressRecord();
  });
  readonly scoreBand = computed(() => {
    const incident = this.incident();
    const score = this.attemptEvaluation().score;
    return incident?.debrief.scoreBands.find((band) => score >= band.min && score <= band.max) ?? null;
  });
  readonly locked = computed(() => {
    const scenario = this.incident();
    return scenario ? scenario.meta.access === 'premium' && !isProActive(this.auth.user()) : false;
  });
  readonly lockedTitle = computed(() => this.incident()?.meta.title || 'Premium debug scenario');
  readonly lockedMemberCopy = computed(() => "You're on the free tier. Upgrade to access this premium debug scenario.");
  readonly lockedGuestCopy = computed(() => 'Upgrade to FrontendAtlas Premium to access this debug scenario. Already upgraded? Sign in to continue.');
  readonly lockedSummary = computed(() => trimWords(this.incident()?.meta.summary || '', 45));
  readonly lockedBullets = computed(() =>
    (this.incident()?.meta.signals ?? [])
      .map((signal) => trimWords(signal, 12))
      .filter(Boolean)
      .slice(0, 2),
  );
  readonly lockedPreview = computed<LockedPreviewData | null>(() => {
    const scenario = this.incident();
    if (!scenario) return null;
    return buildIncidentLockedPreview(scenario, this.incidentList());
  });
  readonly lockedPaths = computed<LockedPath[]>(() => {
    const tech = this.incident()?.meta.tech || 'javascript';
    const challenge = freeChallengeForFramework(frameworkFromTech(tech));
    return [
      {
        id: 'free_challenge',
        label: challenge.label,
        route: challenge.route,
        queryParams: { src: 'incident_locked' },
      },
      {
        id: 'track_previews',
        label: 'Open track previews',
        route: ['/tracks'],
        queryParams: { src: 'incident_locked' },
      },
      {
        id: 'company_previews',
        label: 'Browse company previews',
        route: ['/companies'],
        queryParams: { src: 'incident_locked' },
      },
    ];
  });

  constructor() {
    this.route.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.hydrateFromResolved(data['incidentDetail'] as IncidentDetailResolved | undefined));
  }

  startIncident(): void {
    this.activeStepIndex.set(1);
    this.persistSession();
  }

  goToStep(index: number): void {
    if (!this.isStepUnlocked(index)) return;
    if (index === this.debriefStepIndex()) {
      this.enterDebrief();
      return;
    }
    this.activeStepIndex.set(index);
    this.persistSession();
  }

  previousStep(): void {
    const current = this.activeStepIndex();
    const next = current <= 0 ? 0 : current - 1;
    this.activeStepIndex.set(next);
    this.persistSession();
  }

  nextStep(): void {
    const current = this.activeStepIndex();
    if (current === 0) {
      this.startIncident();
      return;
    }

    const stage = this.currentStage();
    if (stage && !this.isStageSubmitted(stage.id)) return;

    if (current >= this.stages().length) {
      this.enterDebrief();
      return;
    }

    this.activeStepIndex.set(current + 1);
    this.persistSession();
  }

  restartIncident(): void {
    const incident = this.incident();
    if (!incident) return;
    this.answers.set({});
    this.submittedStageIds.set([]);
    this.stageResults.set({});
    this.activeStepIndex.set(0);
    this.progress.clearSession(incident.meta.id);
    this.progress.markStarted(incident.meta.id);
  }

  isStepUnlocked(index: number): boolean {
    if (index === 0) return true;
    if (index === this.debriefStepIndex()) return this.allStagesSubmitted();
    return index <= this.submittedStageIds().length + 1;
  }

  isStageSubmitted(stageId: string): boolean {
    return this.submittedStageIds().includes(stageId);
  }

  isOptionSelected(stageId: string, optionId: string): boolean {
    const answer = this.answers()[stageId];
    if (typeof answer === 'string') return answer === optionId;
    if (Array.isArray(answer)) return answer.includes(optionId);
    return false;
  }

  activateOption(stage: IncidentStage, optionId: string): void {
    if (this.isStageSubmitted(stage.id)) return;

    if (stage.type === 'single-select') {
      this.answers.set({
        ...this.answers(),
        [stage.id]: optionId,
      });
      this.persistSession();
      return;
    }

    const current = this.getMultiSelection(stage.id);
    const next = current.includes(optionId)
      ? current.filter((value) => value !== optionId)
      : [...current, optionId];
    this.answers.set({
      ...this.answers(),
      [stage.id]: next,
    });
    this.persistSession();
  }

  onOptionKeydown(event: KeyboardEvent, stage: IncidentStage, optionId: string): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.activateOption(stage, optionId);
  }

  priorityOrder(stage: IncidentPriorityOrderStage): string[] {
    const answer = this.answers()[stage.id];
    if (Array.isArray(answer) && answer.length === stage.candidates.length) return answer;
    return stage.candidates.map((candidate) => candidate.id);
  }

  movePriorityItem(stage: IncidentPriorityOrderStage, candidateId: string, direction: -1 | 1): void {
    if (this.isStageSubmitted(stage.id)) return;
    const current = [...this.priorityOrder(stage)];
    const index = current.indexOf(candidateId);
    if (index === -1) return;
    const target = index + direction;
    if (target < 0 || target >= current.length) return;

    const swap = current[target];
    if (!swap) return;
    current[target] = candidateId;
    current[index] = swap;
    this.answers.set({
      ...this.answers(),
      [stage.id]: current,
    });
    this.persistSession();
  }

  onPriorityControlKeydown(
    event: KeyboardEvent,
    stage: IncidentPriorityOrderStage,
    candidateId: string,
    direction: -1 | 1,
  ): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.movePriorityItem(stage, candidateId, direction);
  }

  candidateLabel(stage: IncidentPriorityOrderStage, candidateId: string): string {
    return stage.candidates.find((candidate) => candidate.id === candidateId)?.label ?? candidateId;
  }

  candidateDescription(stage: IncidentPriorityOrderStage, candidateId: string): string {
    return stage.candidates.find((candidate) => candidate.id === candidateId)?.description ?? '';
  }

  canSubmitCurrentStage(): boolean {
    const stage = this.currentStage();
    if (!stage || this.isStageSubmitted(stage.id)) return false;

    const answer = this.answers()[stage.id];
    if (stage.type === 'single-select') return typeof answer === 'string' && answer.length > 0;
    if (stage.type === 'multi-select') return Array.isArray(answer) && answer.length > 0;
    return true;
  }

  submitCurrentStage(): void {
    const stage = this.currentStage();
    if (!stage || !this.canSubmitCurrentStage()) return;

    const evaluation = evaluateIncidentStage(stage, this.answers()[stage.id]);
    this.stageResults.set({
      ...this.stageResults(),
      [stage.id]: evaluation,
    });
    this.submittedStageIds.set(Array.from(new Set([...this.submittedStageIds(), stage.id])));
    this.persistSession();
    this.scrollToFeedback(stage.id);
  }

  stageFeedbackStatus(stageId: string): FeedbackStatus {
    const evaluation = this.stageResults()[stageId];
    if (!evaluation || evaluation.maxScore === 0) return 'review';
    if (evaluation.rawScore === evaluation.maxScore) return 'correct';
    if (evaluation.rawScore > 0) return 'partial';
    return 'review';
  }

  feedbackHeading(stageId: string): string {
    const status = this.stageFeedbackStatus(stageId);
    if (status === 'correct') return 'Strong call';
    if (status === 'partial') return 'Useful, but incomplete';
    return 'Needs review';
  }

  nextButtonLabel(): string {
    const current = this.activeStepIndex();
    if (current === 0) return 'Begin simulator';
    if (current >= this.stages().length) return 'View debrief';
    return 'Next stage';
  }

  onReflectionChange(value: string): void {
    const trimmed = String(value || '').slice(0, 240);
    this.reflectionNote.set(trimmed);
    const incident = this.incident();
    if (!incident) return;
    this.progress.saveReflection(incident.meta.id, trimmed);
    this.persistSession();
  }

  relatedPracticeRoute(item: IncidentRelatedPractice): string[] {
    if (item.kind === 'system-design') return ['/system-design', item.id];
    return ['/', item.tech, item.kind, item.id];
  }

  relatedPracticeLabel(item: IncidentRelatedPractice): string {
    if (item.kind === 'system-design') return 'System design follow-up';
    const tech = this.techLabel(item.tech);
    const kind = item.kind === 'trivia'
      ? 'Trivia'
      : item.kind === 'coding'
        ? 'Coding'
        : 'Debug';
    return `${tech} ${kind}`;
  }

  techLabel(tech: string): string {
    return incidentTechLabel(tech);
  }

  goToAdjacentIncident(target: IncidentListItem | null): void {
    if (!target) return;
    void this.router.navigate(['/incidents', target.id]);
  }

  trackByString(_: number, value: string): string {
    return value;
  }

  trackByLockedPath(_: number, path: LockedPath): string {
    return path.id;
  }

  updatedLabel(value: string | null | undefined): string | null {
    return updatedLabel(value);
  }

  goToPricingFromLocked(): void {
    this.router.navigate(['/pricing'], {
      queryParams: { src: 'incident_locked' },
    });
  }

  goToLoginFromLocked(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: { redirectTo: this.router.url || '/' },
    });
  }

  reportAccessIssue(): void {
    const scenario = this.incident();
    this.bugReport.open({
      source: 'incident_locked',
      url: typeof window !== 'undefined' ? window.location.href : this.router.url,
      route: this.router.url,
      tech: scenario?.meta.tech,
      questionId: scenario?.meta.id,
      questionTitle: scenario?.meta.title,
    });
  }

  private hydrateFromResolved(resolved: IncidentDetailResolved | undefined): void {
    const scenario = resolved?.incident ?? null;
    this.incident.set(scenario);
    this.incidentList.set(resolved?.list ?? []);
    this.prevIncident.set(resolved?.prev ?? null);
    this.nextIncident.set(resolved?.next ?? null);

    if (!scenario) return;

    this.updateSeo(scenario);
    if (scenario.meta.access === 'premium' && !isProActive(this.auth.user())) {
      this.answers.set({});
      this.submittedStageIds.set([]);
      this.stageResults.set({});
      this.activeStepIndex.set(0);
      this.reflectionNote.set('');
      return;
    }
    this.progress.markStarted(scenario.meta.id);
    const record = this.progress.getRecord(scenario.meta.id);
    this.reflectionNote.set(record.reflectionNote);

    const session = this.progress.loadSession(scenario.meta.id);
    if (!session) {
      this.answers.set({});
      this.submittedStageIds.set([]);
      this.stageResults.set({});
      this.activeStepIndex.set(0);
      return;
    }

    this.answers.set(session.answers);
    this.submittedStageIds.set(session.submittedStageIds.filter((id) => scenario.stages.some((stage) => stage.id === id)));
    this.stageResults.set(
      this.submittedStageIds().reduce<Record<string, IncidentStageEvaluation>>((acc, stageId) => {
        const stage = scenario.stages.find((entry) => entry.id === stageId);
        if (stage) acc[stageId] = evaluateIncidentStage(stage, session.answers[stageId]);
        return acc;
      }, {}),
    );

    if (this.submittedStageIds().length === scenario.stages.length) {
      const rescoredAttempt = evaluateIncidentAttempt(scenario.stages, session.answers);
      if (rescoredAttempt.score > record.bestScore) {
        this.progress.completeAttempt(scenario.meta.id, rescoredAttempt.score, this.reflectionNote());
      }
    }

    const maxStep = this.allStagesSubmitted() ? this.debriefStepIndex() : this.submittedStageIds().length + 1;
    const desiredStep = Math.min(Math.max(session.activeStepIndex, 0), maxStep);
    this.activeStepIndex.set(desiredStep);
  }

  private updateSeo(scenario: IncidentScenario): void {
    this.seo.updateTags(
      buildIncidentSeoMeta(scenario, (value) => this.seo.buildCanonicalUrl(value)),
    );
  }

  private enterDebrief(): void {
    const incident = this.incident();
    if (!incident || !this.allStagesSubmitted()) return;
    const score = this.attemptEvaluation().score;
    const previous = this.progress.getRecord(incident.meta.id);
    const record = this.progress.completeAttempt(incident.meta.id, score, this.reflectionNote());
    if (!previous.passed && record.passed && this.auth.isLoggedIn()) {
      this.activity.complete({
        kind: 'incident',
        tech: incident.meta.tech,
        itemId: incident.meta.id,
        source: 'tech',
        durationMin: incident.meta.estimatedMinutes,
        difficulty: incident.meta.difficulty,
      })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          error: () => {
            // Keep the local pass even if sync credit fails.
          },
        });
    }
    this.activeStepIndex.set(this.debriefStepIndex());
    this.persistSession();
  }

  private persistSession(): void {
    const incident = this.incident();
    if (!incident) return;
    this.progress.saveSession(incident.meta.id, {
      activeStepIndex: this.activeStepIndex(),
      answers: this.answers(),
      submittedStageIds: this.submittedStageIds(),
    });
  }

  private scrollToFeedback(stageId: string): void {
    if (!this.shouldAutoScrollToFeedback()) return;

    const runScroll = () => {
      const target = document.querySelector<HTMLElement>(`[data-testid="incident-feedback-${stageId}"]`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => runScroll());
      return;
    }

    window.setTimeout(runScroll, 0);
  }

  private shouldAutoScrollToFeedback(): boolean {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(max-width: 640px)').matches;
    }
    return window.innerWidth <= 640;
  }

  private getMultiSelection(stageId: string): string[] {
    const answer = this.answers()[stageId];
    return Array.isArray(answer) ? answer : [];
  }
}
