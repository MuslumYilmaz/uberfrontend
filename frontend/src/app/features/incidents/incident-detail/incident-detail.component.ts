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

type FeedbackStatus = 'correct' | 'partial' | 'review';

@Component({
  standalone: true,
  selector: 'app-incident-detail',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './incident-detail.component.html',
  styleUrls: ['./incident-detail.component.css'],
})
export class IncidentDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seo = inject(SeoService);
  private readonly activity = inject(ActivityService);
  private readonly auth = inject(AuthService);
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
    switch (tech) {
      case 'javascript':
        return 'JavaScript';
      case 'react':
        return 'React';
      case 'angular':
        return 'Angular';
      case 'vue':
        return 'Vue';
      case 'html':
        return 'HTML';
      case 'css':
        return 'CSS';
      default:
        return 'Frontend';
    }
  }

  goToAdjacentIncident(target: IncidentListItem | null): void {
    if (!target) return;
    void this.router.navigate(['/incidents', target.id]);
  }

  trackByString(_: number, value: string): string {
    return value;
  }

  private hydrateFromResolved(resolved: IncidentDetailResolved | undefined): void {
    const scenario = resolved?.incident ?? null;
    this.incident.set(scenario);
    this.incidentList.set(resolved?.list ?? []);
    this.prevIncident.set(resolved?.prev ?? null);
    this.nextIncident.set(resolved?.next ?? null);

    if (!scenario) return;

    this.updateSeo(scenario);
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
    const meta = scenario.meta;
    const techLabel = this.techLabel(meta.tech);
    const canonicalPath = `/incidents/${meta.id}`;
    const canonicalUrl = this.seo.buildCanonicalUrl(canonicalPath);
    const incidentsHubUrl = this.seo.buildCanonicalUrl('/incidents');
    const imageUrl = this.seo.buildCanonicalUrl('/assets/images/frontend-atlas-logo.png');
    const detailDescription = `Practice this ${techLabel.toLowerCase()} debugging interview question. ${meta.summary} Work through the root cause, the first debug steps, the best fix, and the regression guard.`;
    const breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'FrontendAtlas',
          item: this.seo.buildCanonicalUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Debug Scenarios',
          item: incidentsHubUrl,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: meta.title,
          item: canonicalUrl,
        },
      ],
    };
    const learningResource = {
      '@type': 'LearningResource',
      '@id': canonicalUrl,
      name: meta.title,
      headline: meta.title,
      description: detailDescription,
      url: canonicalUrl,
      mainEntityOfPage: canonicalUrl,
      inLanguage: 'en',
      learningResourceType: 'Debug scenario',
      educationalUse: 'Interview practice',
      timeRequired: `PT${meta.estimatedMinutes}M`,
      isAccessibleForFree: meta.access !== 'premium',
      keywords: meta.tags.join(', '),
      dateModified: `${meta.updatedAt}T00:00:00Z`,
      author: { '@type': 'Organization', name: 'FrontendAtlas' },
      publisher: {
        '@type': 'Organization',
        name: 'FrontendAtlas',
        logo: {
          '@type': 'ImageObject',
          url: imageUrl,
        },
      },
      isPartOf: {
        '@type': 'CollectionPage',
        '@id': incidentsHubUrl,
        url: incidentsHubUrl,
        name: 'Frontend Debugging Interview Questions and Debug Scenarios',
      },
      about: [
        { '@type': 'Thing', name: `${techLabel} debugging interview question` },
        { '@type': 'Thing', name: 'Frontend debug scenario' },
      ],
    };
    this.seo.updateTags({
      title: `${meta.title} - ${techLabel} Debug Scenario`,
      description: detailDescription,
      canonical: canonicalPath,
      keywords: [
        ...meta.tags,
        'frontend debug scenario',
        'frontend debugging interview questions',
        `${techLabel.toLowerCase()} debugging interview question`,
        `${techLabel.toLowerCase()} debug scenario`,
      ],
      ogType: 'article',
      jsonLd: [breadcrumb, learningResource],
    });
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

  private getMultiSelection(stageId: string): string[] {
    const answer = this.answers()[stageId];
    return Array.isArray(answer) ? answer : [];
  }
}
