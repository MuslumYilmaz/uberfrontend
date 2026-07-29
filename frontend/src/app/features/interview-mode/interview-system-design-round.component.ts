import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  InterviewChoice,
  InterviewSession,
  InterviewSystemDesignConnectionType,
  InterviewSystemDesignDecision,
  InterviewSystemDesignDraft,
  InterviewSystemDesignPlacement,
  InterviewSystemDesignStep,
} from '../../core/models/interview.model';
import { InterviewService } from '../../core/services/interview.service';
import { FaButtonComponent, FaCardComponent, FaSelectComponent } from '../../shared/ui';

type DesignSyncState = 'idle' | 'saving' | 'saved' | 'offline' | 'error';
type EditableDesignDraft = Omit<InterviewSystemDesignDraft, 'hash' | 'revision' | 'updatedAt'>;
type LocalDesignDraft = {
  sessionId: string;
  scenarioId: string;
  scenarioRevision: number;
  draft: EditableDesignDraft;
  updatedAt: string;
  dirty: boolean;
  baseHash: string | null;
};

const STEPS: Array<{ id: InterviewSystemDesignStep; label: string }> = [
  { id: 'clarifications', label: 'Clarify' },
  { id: 'requirements', label: 'Prioritize' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'decisions', label: 'Decisions' },
  { id: 'twist', label: 'Production twist' },
];

@Component({
  selector: 'app-interview-system-design-round',
  standalone: true,
  imports: [CommonModule, FormsModule, FaButtonComponent, FaCardComponent, FaSelectComponent],
  templateUrl: './interview-system-design-round.component.html',
  styleUrls: ['./interview-system-design-round.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterviewSystemDesignRoundComponent implements OnChanges, OnDestroy {
  private readonly interviews = inject(InterviewService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly sessionState = signal<InterviewSession | null>(null);

  @Input({ required: true })
  set session(value: InterviewSession) {
    this.sessionState.set(value);
  }

  readonly reconcilingState = signal(false);

  @Input()
  set reconciling(value: boolean) {
    const next = value === true;
    const previous = this.reconcilingState();
    if (next && !previous) {
      this.asyncEpoch += 1;
      if (this.saveTimer !== null) {
        clearTimeout(this.saveTimer);
        this.saveTimer = null;
      }
      this.syncedHash.set(null);
    }
    this.reconcilingState.set(next);
    if (
      previous
      && !next
      && (this.conflictPending || this.localDirty)
      && !this.hasDraftConflict()
      && !this.busy()
    ) {
      this.syncedHash.set(null);
      this.syncState.set(this.isOnline() ? 'idle' : 'offline');
      this.scheduleSave(0);
    }
  }

  get session(): InterviewSession {
    const session = this.sessionState();
    if (!session) throw new Error('System design round requires an interview session.');
    return session;
  }
  @Output() sessionUpdated = new EventEmitter<InterviewSession>();
  @Output() completed = new EventEmitter<void>();
  @Output() reconcileRequested = new EventEmitter<void>();

  readonly steps = STEPS;
  readonly draft = signal<EditableDesignDraft>(this.emptyDraft());
  readonly syncState = signal<DesignSyncState>('idle');
  readonly localPersistenceAvailable = signal(true);
  readonly syncedHash = signal<string | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly partialSubmitWarning = signal(false);
  readonly hasDraftConflict = signal(false);
  readonly confirmDeviceDraftRestore = signal(false);
  readonly connectionFrom = signal('');
  readonly connectionTo = signal('');
  readonly connectionType = signal<InterviewSystemDesignConnectionType>('data');

  readonly design = computed(() => this.sessionState()?.systemDesign ?? null);
  readonly scenario = computed(() => this.design()?.scenario ?? null);
  readonly twistRevealed = computed(() => this.design()?.twist.revealed === true);
  readonly currentStepIndex = computed(() =>
    Math.max(0, STEPS.findIndex((step) => step.id === this.draft().currentStep))
  );
  readonly placedCardIds = computed(() =>
    new Set(this.draft().placements.map((placement) => placement.cardId))
  );
  readonly clarificationLimit = computed(() =>
    this.scenario()?.selectionLimits.clarifications ?? 3
  );
  readonly priorityLimit = computed(() =>
    this.scenario()?.selectionLimits.priorities ?? 3
  );
  readonly interactionLocked = computed(() =>
    this.busy() || this.reconcilingState() || this.hasDraftConflict()
  );
  readonly canRevealTwist = computed(() =>
    !!this.syncedHash()
    && this.syncState() === 'saved'
    && !this.interactionLocked()
    && !this.twistRevealed()
  );
  readonly canSubmit = computed(() =>
    !!this.syncedHash()
    && this.syncState() === 'saved'
    && !this.interactionLocked()
    && this.twistRevealed()
  );
  readonly isComplete = computed(() => {
    const scenario = this.scenario();
    const draft = this.draft();
    if (!scenario) return false;
    return draft.selectedClarificationIds.length > 0
      && draft.prioritizedRequirementIds.length >= scenario.selectionLimits.priorities
      && draft.placements.length > 0
      && draft.connections.length > 0
      && draft.decisions.length === scenario.decisions.length
      && draft.decisions.every((decision) => decision.rationaleIds.length > 0)
      && draft.selectedTwistActionIds.length > 0;
  });

  private initializedKey = '';
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private saveInFlight = false;
  private changedWhileSaving = false;
  private conflictPending = false;
  private localDirty = false;
  private localBaseHash: string | null = null;
  private conflictingLocalDraft: LocalDesignDraft | null = null;
  private destroyed = false;
  private localPersistenceDisabled = false;
  private observedLocalRaw: string | null | undefined;
  private asyncEpoch = 0;

  private readonly onOnline = () => {
    if (this.syncState() === 'offline' || this.syncState() === 'error') {
      this.scheduleSave(0);
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['session']) return;
    const scenario = this.session.systemDesign?.scenario;
    if (!scenario) return;
    const nextKey = `${this.session.id}:${scenario.id}:${scenario.revision}`;
    if (nextKey === this.initializedKey) {
      const serverDraft = this.session.systemDesign?.draft;
      if (this.hasDraftConflict()) {
        this.showServerDraft(serverDraft);
        return;
      }
      if (
        this.conflictPending
        || this.localDirty
        || this.saveInFlight
        || this.saveTimer !== null
      ) {
        if (
          (this.localDirty || this.conflictPending)
          && this.localBaseHash !== (serverDraft?.hash ?? null)
        ) {
          if (
            serverDraft?.hash
            && this.sameEditableDraft(
              this.draft(),
              this.editableDraft(serverDraft),
            )
          ) {
            this.conflictPending = false;
            this.changedWhileSaving = false;
            this.localDirty = false;
            this.applyServerDraft(serverDraft);
            return;
          }
          this.openDraftConflict(serverDraft);
          return;
        }
        if (this.conflictPending && !this.localDirty) {
          this.conflictPending = false;
          this.localBaseHash = serverDraft?.hash ?? null;
          if (serverDraft) this.applyServerDraft(serverDraft);
          else this.showServerDraft(serverDraft);
          return;
        }
        this.reconcileLockedDiscovery();
        this.syncedHash.set(null);
        this.syncState.set(this.isOnline() ? 'idle' : 'offline');
        if (this.conflictPending) this.scheduleSave(0);
        return;
      }
      if (serverDraft?.hash) {
        this.localBaseHash = serverDraft.hash;
        this.syncedHash.set(serverDraft.hash);
        if (!this.saveInFlight) this.syncState.set('saved');
      }
      return;
    }
    this.initializedKey = nextKey;
    this.observedLocalRaw = undefined;
    this.connectionType.set(scenario.connectionTypes[0]?.value ?? 'data-flow');
    if (this.isBrowser) window.addEventListener('online', this.onOnline);
    this.restoreDraft();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.saveTimer !== null) clearTimeout(this.saveTimer);
    if (this.isBrowser) window.removeEventListener('online', this.onOnline);
  }

  selectStep(step: InterviewSystemDesignStep): void {
    this.updateDraft({ currentStep: step });
  }

  nextStep(): void {
    const index = this.currentStepIndex();
    if (index >= STEPS.length - 1) return;
    const next = STEPS[index + 1].id;
    this.selectStep(next);
  }

  previousStep(): void {
    const index = this.currentStepIndex();
    if (index > 0) this.selectStep(STEPS[index - 1].id);
  }

  toggleClarification(id: string): void {
    if (this.twistRevealed()) return;
    const current = this.draft().selectedClarificationIds;
    const next = current.includes(id)
      ? current.filter((candidate) => candidate !== id)
      : this.clarificationCanSelect(id)
        ? [...current, id]
        : current;
    if (next !== current) this.updateDraft({ selectedClarificationIds: next });
  }

  clarificationCanSelect(id: string): boolean {
    const current = this.draft().selectedClarificationIds;
    if (current.includes(id)) return true;
    if (current.length >= this.clarificationLimit()) return false;
    const revealed = new Set(this.design()?.revealedClarificationIds ?? []);
    if (revealed.has(id)) return true;
    const used = new Set([...revealed, ...current]);
    return used.size < this.clarificationLimit();
  }

  togglePriority(id: string): void {
    if (this.twistRevealed()) return;
    const current = this.draft().prioritizedRequirementIds;
    const next = current.includes(id)
      ? current.filter((candidate) => candidate !== id)
      : current.length < this.priorityLimit()
        ? [...current, id]
        : current;
    if (next !== current) this.updateDraft({ prioritizedRequirementIds: next });
  }

  movePriority(id: string, direction: -1 | 1): void {
    if (this.twistRevealed()) return;
    const next = [...this.draft().prioritizedRequirementIds];
    const index = next.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    this.updateDraft({ prioritizedRequirementIds: next });
  }

  placeCard(cardId: string, laneId: string): void {
    const scenario = this.scenario();
    const card = scenario?.cards.find((candidate) => candidate.id === cardId);
    if (!card || !scenario?.lanes.some((lane) => lane.id === laneId)) return;
    const current = this.draft().placements.filter((placement) => placement.cardId !== cardId);
    const order = current.filter((placement) => placement.laneId === laneId).length;
    this.updateDraft({
      placements: this.reindexPlacements([...current, { cardId, laneId, order }]),
    });
  }

  onLaneSelection(cardId: string, value: unknown): void {
    const laneId = typeof value === 'string' ? value : '';
    if (laneId) this.placeCard(cardId, laneId);
    else this.removeCard(cardId);
  }

  onConnectionTypeChange(value: unknown): void {
    if (typeof value === 'string' && value) {
      this.connectionType.set(value);
    }
  }

  removeCard(cardId: string): void {
    this.updateDraft({
      placements: this.reindexPlacements(
        this.draft().placements.filter((placement) => placement.cardId !== cardId),
      ),
      connections: this.draft().connections.filter(
        (connection) => connection.fromCardId !== cardId && connection.toCardId !== cardId,
      ),
    });
  }

  moveCard(cardId: string, direction: -1 | 1): void {
    const placements = this.draft().placements.map((placement) => ({ ...placement }));
    const placement = placements.find((candidate) => candidate.cardId === cardId);
    if (!placement) return;
    const inLane = placements
      .filter((candidate) => candidate.laneId === placement.laneId)
      .sort((a, b) => a.order - b.order);
    const index = inLane.findIndex((candidate) => candidate.cardId === cardId);
    const target = index + direction;
    if (target < 0 || target >= inLane.length) return;
    const other = inLane[target];
    const previousOrder = placement.order;
    placement.order = other.order;
    other.order = previousOrder;
    this.updateDraft({ placements: this.reindexPlacements(placements) });
  }

  placementsForLane(laneId: string): InterviewSystemDesignPlacement[] {
    return this.draft().placements
      .filter((placement) => placement.laneId === laneId)
      .sort((a, b) => a.order - b.order);
  }

  cardLabel(cardId: string): string {
    return this.scenario()?.cards.find((card) => card.id === cardId)?.label ?? cardId;
  }

  requirementLabel(requirementId: string): string {
    return this.scenario()?.requirements.find(
      (requirement) => requirement.id === requirementId,
    )?.label ?? requirementId;
  }

  placementLane(cardId: string): string {
    return this.draft().placements.find(
      (placement) => placement.cardId === cardId,
    )?.laneId ?? '';
  }

  laneOptions(cardId: string): InterviewChoice<string>[] {
    const scenario = this.scenario();
    if (!scenario?.cards.some((candidate) => candidate.id === cardId)) return [];
    return [
      { value: '', label: 'Not placed' },
      ...scenario.lanes.map((lane) => ({
        value: lane.id,
        label: lane.label,
      })),
    ];
  }

  placedCardOptions(): InterviewChoice<string>[] {
    return [
      { value: '', label: 'Choose a component' },
      ...this.draft().placements.map((placement) => ({
        value: placement.cardId,
        label: this.cardLabel(placement.cardId),
      })),
    ];
  }

  addConnection(): void {
    const fromCardId = this.connectionFrom();
    const toCardId = this.connectionTo();
    const type = this.connectionType();
    const placed = this.placedCardIds();
    if (!fromCardId || !toCardId || fromCardId === toCardId) return;
    if (!placed.has(fromCardId) || !placed.has(toCardId)) return;
    if (
      this.draft().connections.length
        >= (this.scenario()?.selectionLimits.connections ?? 8)
    ) return;
    if (this.draft().connections.some((connection) =>
      connection.fromCardId === fromCardId
      && connection.toCardId === toCardId
      && connection.type === type
    )) return;
    this.updateDraft({
      connections: [
        ...this.draft().connections,
        {
          id: this.newId('connection'),
          fromCardId,
          toCardId,
          type,
        },
      ],
    });
    this.connectionTo.set('');
  }

  removeConnection(id: string): void {
    this.updateDraft({
      connections: this.draft().connections.filter((connection) => connection.id !== id),
    });
  }

  selectDecisionOption(decision: InterviewSystemDesignDecision, optionId: string): void {
    const existing = this.draft().decisions.find((answer) => answer.decisionId === decision.id);
    const decisions = this.draft().decisions.filter((answer) => answer.decisionId !== decision.id);
    decisions.push({
      decisionId: decision.id,
      optionId,
      rationaleIds: existing?.rationaleIds ?? [],
    });
    this.updateDraft({ decisions });
  }

  toggleRationale(decisionId: string, rationaleId: string): void {
    const existing = this.draft().decisions.find((answer) => answer.decisionId === decisionId);
    if (!existing) return;
    const limit = this.rationaleLimit();
    if (!existing.rationaleIds.includes(rationaleId) && existing.rationaleIds.length >= limit) {
      return;
    }
    const rationaleIds = existing.rationaleIds.includes(rationaleId)
      ? existing.rationaleIds.filter((candidate) => candidate !== rationaleId)
      : [...existing.rationaleIds, rationaleId];
    this.updateDraft({
      decisions: this.draft().decisions.map((answer) =>
        answer.decisionId === decisionId ? { ...answer, rationaleIds } : answer
      ),
    });
  }

  selectedDecisionOption(decisionId: string): string {
    return this.draft().decisions.find((answer) => answer.decisionId === decisionId)?.optionId ?? '';
  }

  rationaleSelected(decisionId: string, rationaleId: string): boolean {
    return this.draft().decisions
      .find((answer) => answer.decisionId === decisionId)
      ?.rationaleIds.includes(rationaleId) === true;
  }

  rationaleCanSelect(decisionId: string, rationaleId: string): boolean {
    const existing = this.draft().decisions.find((answer) => answer.decisionId === decisionId);
    if (!existing || existing.rationaleIds.includes(rationaleId)) return true;
    return existing.rationaleIds.length < this.rationaleLimit();
  }

  selectedRationaleCount(decisionId: string): number {
    return this.draft().decisions.find(
      (answer) => answer.decisionId === decisionId,
    )?.rationaleIds.length ?? 0;
  }

  revealTwist(): void {
    const hash = this.syncedHash();
    if (!hash || !this.canRevealTwist()) return;
    this.busy.set(true);
    this.error.set(null);
    const requestEpoch = this.asyncEpoch;
    this.interviews.revealSystemDesignTwist(
      this.session.id,
      hash,
      this.newId('twist'),
      this.session.version,
    ).subscribe({
      next: (result) => {
        if (this.ignoreAsyncResult(requestEpoch)) return;
        this.busy.set(false);
        if (result.session) {
          this.session = result.session;
          this.sessionUpdated.emit(result.session);
        }
        const serverDraft = result.draft ?? result.session?.systemDesign?.draft;
        if (serverDraft) this.applyServerDraft(serverDraft);
        this.updateDraft({ currentStep: 'twist' });
      },
      error: (error) => {
        if (this.ignoreAsyncResult(requestEpoch)) return;
        this.busy.set(false);
        if (error?.status === 409) {
          this.conflictPending = true;
          this.syncedHash.set(null);
          this.syncState.set('error');
          this.error.set('The interview changed in another tab. Your local design is safe while we reload.');
          this.reconcileRequested.emit();
        } else {
          this.error.set('The production twist could not be revealed. Try again.');
        }
      },
    });
  }

  toggleTwistAction(id: string): void {
    if (!this.twistRevealed()) return;
    const current = this.draft().selectedTwistActionIds;
    const max = this.design()?.twist.maxActions ?? 2;
    const next = current.includes(id)
      ? current.filter((candidate) => candidate !== id)
      : current.length < max
        ? [...current, id]
        : current;
    if (next !== current) this.updateDraft({ selectedTwistActionIds: next });
  }

  updateScratchpad(value: string): void {
    const limit = this.scenario()?.selectionLimits.scratchpadChars ?? 200;
    this.updateDraft({ scratchpad: [...String(value || '')].slice(0, limit).join('') });
  }

  requestSubmit(forcePartial = false): void {
    if (!this.canSubmit()) return;
    if (!this.isComplete() && !forcePartial) {
      this.partialSubmitWarning.set(true);
      return;
    }
    const hash = this.syncedHash();
    if (!hash) return;
    this.busy.set(true);
    this.error.set(null);
    this.partialSubmitWarning.set(false);
    const requestEpoch = this.asyncEpoch;
    this.interviews.submitSystemDesign(
      this.session.id,
      hash,
      this.newId('submit'),
      this.session.version,
    ).subscribe({
      next: (result) => {
        if (this.ignoreAsyncResult(requestEpoch)) return;
        this.busy.set(false);
        if (result.session) {
          this.session = result.session;
          this.sessionUpdated.emit(result.session);
        }
        this.clearLocal();
        this.completed.emit();
      },
      error: (error) => {
        if (this.ignoreAsyncResult(requestEpoch)) return;
        this.busy.set(false);
        if (error?.status === 409) {
          this.conflictPending = true;
          this.syncedHash.set(null);
          this.syncState.set('error');
          this.error.set('The latest design must finish syncing before submission. Your local draft is safe.');
          this.reconcileRequested.emit();
        } else {
          this.error.set('The system design round could not be submitted. Your local draft is safe.');
        }
      },
    });
  }

  syncLabel(): string {
    if (this.hasDraftConflict()) return 'Draft choice required';
    if (this.reconcilingState()) return 'Finalizing timed round…';
    switch (this.syncState()) {
      case 'saving': return 'Saving design…';
      case 'saved': return 'Design saved';
      case 'offline':
        return this.localPersistenceAvailable()
          ? 'Offline · saved on this device'
          : 'Offline · kept in this tab only';
      case 'error':
        return this.localPersistenceAvailable()
          ? 'Local design safe · sync pending'
          : 'Draft kept in this tab only · sync pending';
      default: return 'Autosave ready';
    }
  }

  discardLocalDraft(): void {
    this.clearLocal();
  }

  useServerDraft(): void {
    if (!this.hasDraftConflict() || this.reconcilingState() || this.busy()) return;
    const serverDraft = this.session.systemDesign?.draft;
    const discardedLocal = this.conflictingLocalDraft;
    this.conflictingLocalDraft = null;
    this.hasDraftConflict.set(false);
    this.confirmDeviceDraftRestore.set(false);
    this.conflictPending = false;
    this.localDirty = false;
    this.localBaseHash = serverDraft?.hash ?? null;
    this.error.set(null);
    this.showServerDraft(serverDraft);
    if (discardedLocal) this.removeStoredDraftIfMatches(discardedLocal);
  }

  requestDeviceDraftRestore(): void {
    if (!this.hasDraftConflict() || this.reconcilingState() || this.busy()) return;
    this.confirmDeviceDraftRestore.set(true);
  }

  cancelDeviceDraftRestore(): void {
    this.confirmDeviceDraftRestore.set(false);
  }

  restoreDeviceDraft(): void {
    const local = this.conflictingLocalDraft;
    if (
      !local
      || !this.hasDraftConflict()
      || !this.confirmDeviceDraftRestore()
      || this.reconcilingState()
      || this.busy()
    ) return;
    const serverHash = this.session.systemDesign?.draft?.hash ?? null;
    this.asyncEpoch += 1;
    this.conflictingLocalDraft = null;
    this.hasDraftConflict.set(false);
    this.confirmDeviceDraftRestore.set(false);
    this.conflictPending = false;
    this.localBaseHash = serverHash;
    this.localDirty = true;
    this.draft.set(this.cloneEditableDraft(local.draft));
    this.syncedHash.set(null);
    this.syncState.set(this.isOnline() ? 'idle' : 'offline');
    this.error.set(null);
    this.reconcileLockedDiscovery();
    this.persistLocal(undefined, true, this.localBaseHash);
    this.scheduleSave(0);
  }

  private restoreDraft(): void {
    const serverDraft = this.session.systemDesign?.draft;
    const local = this.readLocal(true);
    const useLocal = local?.dirty === true;
    const serverHash = serverDraft?.hash ?? null;
    const localMatchesServer = Boolean(
      useLocal
      && serverDraft?.hash
      && this.sameEditableDraft(local.draft, this.editableDraft(serverDraft)),
    );
    if (useLocal && !localMatchesServer && local.baseHash !== serverHash) {
      this.conflictingLocalDraft = local;
      this.hasDraftConflict.set(true);
      this.confirmDeviceDraftRestore.set(false);
      this.localDirty = false;
      this.localBaseHash = serverHash;
      this.showServerDraft(serverDraft);
      return;
    }
    const recoverLocal = useLocal && !localMatchesServer;
    this.conflictingLocalDraft = null;
    this.hasDraftConflict.set(false);
    this.confirmDeviceDraftRestore.set(false);
    this.localDirty = recoverLocal;
    this.localBaseHash = recoverLocal ? local.baseHash : serverHash;
    this.draft.set(recoverLocal ? local.draft : this.editableDraft(serverDraft));
    this.syncedHash.set(recoverLocal ? null : serverDraft?.hash ?? null);
    if (recoverLocal) this.reconcileLockedDiscovery();
    this.syncState.set(recoverLocal
      ? this.isOnline() ? 'idle' : 'offline'
      : serverDraft?.hash ? 'saved' : 'idle');
    if (localMatchesServer && serverDraft) {
      this.persistLocal(
        serverDraft.updatedAt ?? undefined,
        false,
        serverDraft.hash,
      );
    }
    if (recoverLocal || !serverDraft?.hash) this.scheduleSave(0);
  }

  private updateDraft(
    patch: Partial<EditableDesignDraft>,
    save = true,
  ): void {
    if (this.interactionLocked() || this.destroyed || this.localPersistenceDisabled) return;
    if (!this.localDirty) this.localBaseHash = this.syncedHash();
    this.draft.update((current) => ({ ...current, ...patch }));
    this.partialSubmitWarning.set(false);
    this.error.set(null);
    this.localDirty = true;
    this.persistLocal(undefined, true, this.localBaseHash);
    if (!save) return;
    if (this.saveInFlight) this.changedWhileSaving = true;
    this.syncedHash.set(null);
    this.syncState.set(this.isOnline() ? 'idle' : 'offline');
    this.scheduleSave();
  }

  private scheduleSave(delayMs = 800): void {
    if (
      this.destroyed
      || this.localPersistenceDisabled
      || this.interactionLocked()
    ) return;
    if (this.saveTimer !== null) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.saveNow();
    }, delayMs);
  }

  private saveNow(): void {
    if (
      this.destroyed
      || this.localPersistenceDisabled
      || this.interactionLocked()
    ) return;
    if (!this.localDirty && !this.conflictPending && this.syncedHash()) return;
    if (!this.isOnline()) {
      this.syncState.set('offline');
      return;
    }
    if (this.saveInFlight) {
      this.changedWhileSaving = true;
      return;
    }
    this.saveInFlight = true;
    this.changedWhileSaving = false;
    this.syncState.set('saving');
    const requestEpoch = this.asyncEpoch;
    this.interviews.saveSystemDesignDraft(
      this.session.id,
      { draft: this.draft(), mutationId: this.newId('draft') },
      this.session.version,
    ).subscribe({
      next: (result) => {
        if (this.ignoreAsyncResult(requestEpoch)) return;
        this.saveInFlight = false;
        this.error.set(null);
        const saved = result.draft ?? result.session?.systemDesign?.draft;
        const hash = saved?.hash ?? null;
        if (this.changedWhileSaving) {
          this.localDirty = true;
          if (hash) this.localBaseHash = hash;
          this.syncedHash.set(null);
          this.syncState.set('idle');
          this.persistLocal(
            saved?.updatedAt ?? undefined,
            true,
            this.localBaseHash,
          );
          if (result.session) {
            this.session = result.session;
            this.sessionUpdated.emit(result.session);
          }
          this.scheduleSave(0);
          return;
        }
        this.conflictPending = false;
        this.localDirty = !hash;
        if (hash) this.localBaseHash = hash;
        this.syncedHash.set(hash);
        this.syncState.set(hash ? 'saved' : 'error');
        this.persistLocal(
          saved?.updatedAt ?? undefined,
          this.localDirty,
          this.localBaseHash,
        );
        if (result.session) {
          this.session = result.session;
          this.sessionUpdated.emit(result.session);
        }
      },
      error: (error) => {
        if (this.ignoreAsyncResult(requestEpoch)) return;
        this.saveInFlight = false;
        this.localDirty = true;
        this.syncedHash.set(null);
        this.syncState.set(this.isOnline() ? 'error' : 'offline');
        if (error?.status === 409) {
          this.conflictPending = true;
          this.error.set('Design sync paused because this interview changed in another tab.');
          this.reconcileRequested.emit();
        } else if (
          error?.status === 400
          && String(error?.error?.code || '') === 'INTERVIEW_SYSTEM_DESIGN_CLARIFICATION_LIMIT_REACHED'
        ) {
          this.error.set(
            `You have already revealed ${this.clarificationLimit()} clarification answers. `
            + 'Remove the new question or choose one you revealed earlier to continue syncing.',
          );
        } else {
          this.error.set('The design could not sync. Your local draft is safe; try another change or reconnect.');
        }
      },
    });
  }

  private applyServerDraft(serverDraft: InterviewSystemDesignDraft): void {
    this.localDirty = false;
    this.localBaseHash = serverDraft.hash;
    this.error.set(null);
    this.draft.set(this.editableDraft(serverDraft));
    this.syncedHash.set(serverDraft.hash);
    this.syncState.set(serverDraft.hash ? 'saved' : 'idle');
    this.persistLocal(serverDraft.updatedAt ?? undefined, false, serverDraft.hash);
  }

  private reconcileLockedDiscovery(): void {
    const design = this.session.systemDesign;
    const serverDraft = design?.draft;
    if (design?.stage !== 'twist' || !serverDraft) return;
    const current = this.draft();
    this.draft.set({
      ...current,
      selectedClarificationIds: [...serverDraft.selectedClarificationIds],
      prioritizedRequirementIds: [...serverDraft.prioritizedRequirementIds],
    });
    if (!this.localDirty) this.localBaseHash = serverDraft.hash ?? this.syncedHash();
    this.localDirty = true;
    this.persistLocal(undefined, true, this.localBaseHash);
  }

  private editableDraft(
    source: InterviewSystemDesignDraft | null | undefined,
  ): EditableDesignDraft {
    if (!source) return this.emptyDraft();
    return {
      currentStep: source.currentStep,
      selectedClarificationIds: [...source.selectedClarificationIds],
      prioritizedRequirementIds: [...source.prioritizedRequirementIds],
      placements: source.placements.map((placement) => ({ ...placement })),
      connections: source.connections.map((connection) => ({ ...connection })),
      decisions: source.decisions.map((answer) => ({
        ...answer,
        rationaleIds: [...answer.rationaleIds],
      })),
      selectedTwistActionIds: [...source.selectedTwistActionIds],
      scratchpad: source.scratchpad,
    };
  }

  private cloneEditableDraft(source: EditableDesignDraft): EditableDesignDraft {
    return {
      currentStep: source.currentStep,
      selectedClarificationIds: [...source.selectedClarificationIds],
      prioritizedRequirementIds: [...source.prioritizedRequirementIds],
      placements: source.placements.map((placement) => ({ ...placement })),
      connections: source.connections.map((connection) => ({ ...connection })),
      decisions: source.decisions.map((decision) => ({
        ...decision,
        rationaleIds: [...decision.rationaleIds],
      })),
      selectedTwistActionIds: [...source.selectedTwistActionIds],
      scratchpad: source.scratchpad,
    };
  }

  private reindexPlacements(
    placements: InterviewSystemDesignPlacement[],
  ): InterviewSystemDesignPlacement[] {
    const laneOrder = new Map(
      (this.scenario()?.lanes ?? []).map((lane, index) => [lane.id, index]),
    );
    const sorted = placements
      .map((placement) => ({ ...placement }))
      .sort((a, b) =>
        (laneOrder.get(a.laneId) ?? Number.MAX_SAFE_INTEGER)
          - (laneOrder.get(b.laneId) ?? Number.MAX_SAFE_INTEGER)
        || a.order - b.order
        || a.cardId.localeCompare(b.cardId)
      );
    const counts = new Map<string, number>();
    return sorted.map((placement) => {
      const order = counts.get(placement.laneId) ?? 0;
      counts.set(placement.laneId, order + 1);
      return { ...placement, order };
    });
  }

  private emptyDraft(): EditableDesignDraft {
    return {
      currentStep: 'clarifications',
      selectedClarificationIds: [],
      prioritizedRequirementIds: [],
      placements: [],
      connections: [],
      decisions: [],
      selectedTwistActionIds: [],
      scratchpad: '',
    };
  }

  private persistLocal(
    updatedAt = new Date().toISOString(),
    dirty = this.localDirty,
    baseHash = dirty ? this.localBaseHash : this.syncedHash(),
  ): void {
    const scenario = this.scenario();
    if (
      this.destroyed
      || this.localPersistenceDisabled
      || !this.isBrowser
      || !scenario
      || !this.session?.id
    ) return;
    const payload: LocalDesignDraft = {
      sessionId: this.session.id,
      scenarioId: scenario.id,
      scenarioRevision: scenario.revision,
      draft: this.draft(),
      updatedAt,
      dirty,
      baseHash,
    };
    try {
      const storageKey = this.storageKey();
      const currentRaw = localStorage.getItem(storageKey);
      if (
        this.observedLocalRaw !== undefined
        && currentRaw !== this.observedLocalRaw
      ) {
        this.localPersistenceAvailable.set(false);
        return;
      }
      const serialized = JSON.stringify(payload);
      localStorage.setItem(storageKey, serialized);
      this.observedLocalRaw = serialized;
      this.localPersistenceAvailable.set(true);
    } catch {
      this.localPersistenceAvailable.set(false);
    }
  }

  private readLocal(observe = false): LocalDesignDraft | null {
    const scenario = this.scenario();
    if (!this.isBrowser || !scenario) return null;
    try {
      const raw = localStorage.getItem(this.storageKey());
      if (observe) this.observedLocalRaw = raw;
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<LocalDesignDraft>;
      const sanitized = this.sanitizeLocalDraft(parsed.draft);
      return parsed.sessionId === this.session.id
        && parsed.scenarioId === scenario.id
        && parsed.scenarioRevision === scenario.revision
        && sanitized
        && typeof parsed.updatedAt === 'string'
        && typeof parsed.dirty === 'boolean'
        ? {
          sessionId: parsed.sessionId,
          scenarioId: parsed.scenarioId,
          scenarioRevision: parsed.scenarioRevision,
          draft: sanitized,
          updatedAt: parsed.updatedAt,
          dirty: parsed.dirty,
          baseHash: typeof parsed.baseHash === 'string' ? parsed.baseHash : null,
        }
        : null;
    } catch {
      return null;
    }
  }

  private sanitizeLocalDraft(value: unknown): EditableDesignDraft | null {
    const scenario = this.scenario();
    if (!scenario || !value || typeof value !== 'object' || Array.isArray(value)) return null;
    const source = value as Record<string, unknown>;
    const requiredArrays = [
      'selectedClarificationIds',
      'prioritizedRequirementIds',
      'placements',
      'connections',
      'decisions',
      'selectedTwistActionIds',
    ];
    if (requiredArrays.some((key) => !Array.isArray(source[key]))) return null;
    const step = String(source['currentStep'] || '');
    if (!STEPS.some((candidate) => candidate.id === step)) return null;
    const uniqueAllowed = (raw: unknown, allowed: Set<string>, limit: number): string[] => {
      const result: string[] = [];
      for (const entry of raw as unknown[]) {
        if (typeof entry !== 'string' || !allowed.has(entry) || result.includes(entry)) continue;
        result.push(entry);
        if (result.length >= limit) break;
      }
      return result;
    };
    const cardById = new Map(scenario.cards.map((card) => [card.id, card]));
    const laneIds = new Set(scenario.lanes.map((lane) => lane.id));
    const seenCards = new Set<string>();
    const placements = (source['placements'] as unknown[])
      .map((entry) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
        const row = entry as Record<string, unknown>;
        const cardId = typeof row['cardId'] === 'string' ? row['cardId'] : '';
        const laneId = typeof row['laneId'] === 'string' ? row['laneId'] : '';
        const card = cardById.get(cardId);
        if (
          !card
          || !laneIds.has(laneId)
          || seenCards.has(cardId)
        ) return null;
        seenCards.add(cardId);
        return {
          cardId,
          laneId,
          order: Number.isInteger(row['order']) && Number(row['order']) >= 0
            ? Number(row['order'])
            : 0,
        };
      })
      .filter((entry): entry is InterviewSystemDesignPlacement => entry !== null);
    const placedIds = new Set(placements.map((placement) => placement.cardId));
    const typeIds = new Set(scenario.connectionTypes.map((type) => type.value));
    const connectionKeys = new Set<string>();
    const connections = (source['connections'] as unknown[])
      .map((entry, index) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
        const row = entry as Record<string, unknown>;
        const fromCardId = typeof row['fromCardId'] === 'string' ? row['fromCardId'] : '';
        const toCardId = typeof row['toCardId'] === 'string' ? row['toCardId'] : '';
        const type = typeof row['type'] === 'string' ? row['type'] : '';
        const key = `${fromCardId}\0${toCardId}\0${type}`;
        if (
          !placedIds.has(fromCardId)
          || !placedIds.has(toCardId)
          || fromCardId === toCardId
          || !typeIds.has(type)
          || connectionKeys.has(key)
        ) return null;
        connectionKeys.add(key);
        return {
          id: typeof row['id'] === 'string' && row['id']
            ? row['id']
            : `connection-${index + 1}`,
          fromCardId,
          toCardId,
          type,
        };
      })
      .filter((entry): entry is EditableDesignDraft['connections'][number] => entry !== null)
      .slice(0, scenario.selectionLimits.connections);
    const decisionById = new Map(scenario.decisions.map((decision) => [decision.id, decision]));
    const seenDecisions = new Set<string>();
    const decisions = (source['decisions'] as unknown[])
      .map((entry) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
        const row = entry as Record<string, unknown>;
        const decisionId = typeof row['decisionId'] === 'string' ? row['decisionId'] : '';
        const optionId = typeof row['optionId'] === 'string' ? row['optionId'] : '';
        const definition = decisionById.get(decisionId);
        if (
          !definition
          || seenDecisions.has(decisionId)
          || !definition.options.some((option) => option.id === optionId)
        ) return null;
        seenDecisions.add(decisionId);
        return {
          decisionId,
          optionId,
          rationaleIds: uniqueAllowed(
            Array.isArray(row['rationaleIds']) ? row['rationaleIds'] : [],
            new Set(definition.rationales.map((rationale) => rationale.id)),
            Math.min(definition.rationales.length, this.rationaleLimit()),
          ),
        };
      })
      .filter((entry): entry is EditableDesignDraft['decisions'][number] => entry !== null);
    return {
      currentStep: step as InterviewSystemDesignStep,
      selectedClarificationIds: uniqueAllowed(
        source['selectedClarificationIds'],
        new Set(scenario.clarifications.map((item) => item.id)),
        scenario.selectionLimits.clarifications,
      ),
      prioritizedRequirementIds: uniqueAllowed(
        source['prioritizedRequirementIds'],
        new Set(scenario.requirements.map((item) => item.id)),
        scenario.selectionLimits.priorities,
      ),
      placements: this.reindexPlacements(placements),
      connections,
      decisions,
      selectedTwistActionIds: uniqueAllowed(
        source['selectedTwistActionIds'],
        new Set((this.design()?.twist.actions ?? []).map((action) => action.id)),
        scenario.selectionLimits.twistActions,
      ),
      scratchpad: typeof source['scratchpad'] === 'string'
        ? [...source['scratchpad']].slice(0, scenario.selectionLimits.scratchpadChars).join('')
        : '',
    };
  }

  private showServerDraft(
    serverDraft: InterviewSystemDesignDraft | null | undefined,
  ): void {
    this.draft.set(this.editableDraft(serverDraft));
    this.syncedHash.set(serverDraft?.hash ?? null);
    this.syncState.set(serverDraft?.hash ? 'saved' : 'idle');
  }

  private openDraftConflict(
    serverDraft: InterviewSystemDesignDraft | null | undefined,
  ): void {
    const scenario = this.scenario();
    if (!scenario) return;
    this.asyncEpoch += 1;
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    const currentDraft = this.cloneEditableDraft(this.draft());
    const stored = this.readLocal();
    const storedMatchesCurrent = !!stored
      && stored.dirty
      && stored.baseHash === this.localBaseHash
      && this.sameEditableDraft(stored.draft, currentDraft);
    this.conflictingLocalDraft = {
      sessionId: this.session.id,
      scenarioId: scenario.id,
      scenarioRevision: scenario.revision,
      draft: currentDraft,
      updatedAt: storedMatchesCurrent
        ? stored.updatedAt
        : new Date().toISOString(),
      dirty: true,
      baseHash: this.localBaseHash,
    };
    this.hasDraftConflict.set(true);
    this.confirmDeviceDraftRestore.set(false);
    this.conflictPending = false;
    this.saveInFlight = false;
    this.changedWhileSaving = false;
    this.localDirty = false;
    this.localBaseHash = serverDraft?.hash ?? null;
    this.error.set(null);
    this.showServerDraft(serverDraft);
  }

  private clearLocal(): void {
    this.asyncEpoch += 1;
    this.localPersistenceDisabled = true;
    this.localDirty = false;
    this.conflictingLocalDraft = null;
    this.hasDraftConflict.set(false);
    this.confirmDeviceDraftRestore.set(false);
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.removeStoredDraft();
  }

  private removeStoredDraft(): void {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem(this.storageKey());
      this.observedLocalRaw = null;
    } catch {
      // Completion is authoritative even if local cleanup is unavailable.
    }
  }

  private removeStoredDraftIfMatches(expected: LocalDesignDraft): void {
    const current = this.readLocal();
    if (
      !current
      || current.sessionId !== expected.sessionId
      || current.scenarioId !== expected.scenarioId
      || current.scenarioRevision !== expected.scenarioRevision
      || current.dirty !== expected.dirty
      || current.baseHash !== expected.baseHash
      || current.updatedAt !== expected.updatedAt
      || !this.sameEditableDraft(current.draft, expected.draft)
    ) return;
    this.removeStoredDraft();
  }

  private sameEditableDraft(
    left: EditableDesignDraft,
    right: EditableDesignDraft,
  ): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  private storageKey(): string {
    return `fa:interview:system-design-draft:v1:${this.session.id}`;
  }

  private isOnline(): boolean {
    return !this.isBrowser || navigator.onLine !== false;
  }

  private rationaleLimit(): number {
    return Math.max(1, this.scenario()?.selectionLimits.rationalesPerDecision ?? 2);
  }

  private ignoreAsyncResult(requestEpoch: number): boolean {
    return (
      this.destroyed
      || this.localPersistenceDisabled
      || this.hasDraftConflict()
      || requestEpoch !== this.asyncEpoch
    );
  }

  private newId(prefix: string): string {
    if (this.isBrowser && typeof crypto?.randomUUID === 'function') {
      return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
