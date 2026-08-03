import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { PrismHighlightDirective } from '../../../../core/directives/prism-highlight.directive';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { FaButtonComponent } from '../../../../shared/ui/button/fa-button.component';
import { FaCardComponent } from '../../../../shared/ui/card/fa-card.component';
import { FaChipComponent } from '../../../../shared/ui/chip/fa-chip.component';
import { FaGlyphComponent } from '../../../../shared/ui/icon/fa-glyph.component';
import {
  REACT_STALE_CLOSURE_CASE_FILES,
  REACT_STALE_CLOSURE_TRUST_NOTE,
  ReactStaleClosureCaseFile,
  ReactStaleClosureCaseId,
  ReactStaleClosureContractId,
} from './react-stale-closure-case-files.content';

type CaseInteractionAction =
  | 'case_selected'
  | 'prediction_answered'
  | 'contract_selected'
  | 'verdict_revealed'
  | 'completed'
  | 'prescription_copied';

type PredictionSelections = Partial<Record<ReactStaleClosureCaseId, string>>;
type ContractSelections = Partial<
  Record<ReactStaleClosureCaseId, ReactStaleClosureContractId>
>;

@Component({
  selector: 'app-react-stale-closure-case-files',
  standalone: true,
  imports: [
    CommonModule,
    PrismHighlightDirective,
    FaButtonComponent,
    FaCardComponent,
    FaChipComponent,
    FaGlyphComponent,
  ],
  templateUrl: './react-stale-closure-case-files.component.html',
  styleUrls: ['./react-stale-closure-case-files.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReactStaleClosureCaseFilesComponent {
  private readonly analytics = inject(AnalyticsService);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly caseFiles = REACT_STALE_CLOSURE_CASE_FILES;
  readonly trustNote = REACT_STALE_CLOSURE_TRUST_NOTE;
  readonly predictions = signal<PredictionSelections>({});
  readonly contracts = signal<ContractSelections>({});
  readonly revealedCaseIds = signal<ReadonlySet<ReactStaleClosureCaseId>>(new Set());
  readonly liveMessage = signal('');
  private completedTracked = false;

  trackCase(_: number, caseFile: ReactStaleClosureCaseFile): ReactStaleClosureCaseId {
    return caseFile.id;
  }

  onCaseSummaryActivated(
    caseId: ReactStaleClosureCaseId,
    event: Event,
  ): void {
    const summary = event.currentTarget as HTMLElement | null;
    const disclosure = summary?.parentElement as HTMLDetailsElement | null;
    if (!disclosure || disclosure.open) {
      return;
    }

    this.trackInteraction('case_selected', caseId);
  }

  selectPrediction(
    caseFile: ReactStaleClosureCaseFile,
    predictionId: string,
  ): void {
    this.predictions.update((current) => ({
      ...current,
      [caseFile.id]: predictionId,
    }));

    const correct = predictionId === caseFile.correctPredictionId;
    this.liveMessage.set(
      `${caseFile.heading}: prediction ${correct ? 'correct' : 'not yet correct'}.`,
    );
    this.analytics.track('trivia_case_file_interacted', {
      topic: 'react_stale_closures',
      action: 'prediction_answered',
      case_id: caseFile.id,
      prediction: predictionId,
      correct,
    });
  }

  selectContract(
    caseFile: ReactStaleClosureCaseFile,
    contractId: ReactStaleClosureContractId,
  ): void {
    this.contracts.update((current) => ({
      ...current,
      [caseFile.id]: contractId,
    }));

    const correct = contractId === caseFile.correctContractId;
    this.liveMessage.set(
      `${caseFile.heading}: contract ${correct ? 'correct' : 'not yet correct'}.`,
    );
    this.analytics.track('trivia_case_file_interacted', {
      topic: 'react_stale_closures',
      action: 'contract_selected',
      case_id: caseFile.id,
      contract: contractId,
      correct,
    });
  }

  onVerdictToggle(caseFile: ReactStaleClosureCaseFile, event: Event): void {
    const disclosure = event.currentTarget as HTMLDetailsElement | null;
    if (!disclosure?.open) {
      return;
    }

    this.trackInteraction('verdict_revealed', caseFile.id);

    const revealed = new Set(this.revealedCaseIds());
    revealed.add(caseFile.id);
    this.revealedCaseIds.set(revealed);
    this.liveMessage.set(`${caseFile.heading}: review prescription revealed.`);

    if (!this.completedTracked && revealed.size === this.caseFiles.length) {
      this.completedTracked = true;
      this.liveMessage.set('All six stale-closure case files completed.');
      this.analytics.track('trivia_case_file_interacted', {
        topic: 'react_stale_closures',
        action: 'completed',
      });
    }
  }

  selectedPrediction(caseId: ReactStaleClosureCaseId): string | undefined {
    return this.predictions()[caseId];
  }

  selectedContract(
    caseId: ReactStaleClosureCaseId,
  ): ReactStaleClosureContractId | undefined {
    return this.contracts()[caseId];
  }

  predictionIsCorrect(caseFile: ReactStaleClosureCaseFile): boolean {
    return this.selectedPrediction(caseFile.id) === caseFile.correctPredictionId;
  }

  contractIsCorrect(caseFile: ReactStaleClosureCaseFile): boolean {
    return this.selectedContract(caseFile.id) === caseFile.correctContractId;
  }

  async copyPrescription(caseFile: ReactStaleClosureCaseFile): Promise<void> {
    const fallback = caseFile.fallbackCode
      ? `\n\nReact 18 fallback\n${caseFile.fallbackCode}`
      : '';
    const copyValue = `${caseFile.prescriptionTitle}\n\n${caseFile.afterCode}${fallback}\n\nProof\n${caseFile.proofAssertion}`;
    const didCopy = await this.copyText(copyValue);

    this.liveMessage.set(
      didCopy
        ? `${caseFile.heading}: prescription copied.`
        : `${caseFile.heading}: copy failed. Select the code and copy it manually.`,
    );

    if (didCopy) {
      this.trackInteraction('prescription_copied', caseFile.id);
    }
  }

  private trackInteraction(
    action: CaseInteractionAction,
    caseId: ReactStaleClosureCaseId,
  ): void {
    this.analytics.track('trivia_case_file_interacted', {
      topic: 'react_stale_closures',
      action,
      case_id: caseId,
    });
  }

  private async copyText(value: string): Promise<boolean> {
    if (!this.isBrowser || !value) {
      return false;
    }

    try {
      if (globalThis.navigator?.clipboard?.writeText) {
        await globalThis.navigator.clipboard.writeText(value);
        return true;
      }
    } catch {
      // Fall through to the selection-based copy path.
    }

    return this.copyWithTextarea(value);
  }

  private copyWithTextarea(value: string): boolean {
    if (!this.isBrowser || !this.document.body) {
      return false;
    }

    const textarea = this.document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.inset = '0 auto auto -9999px';
    this.document.body.appendChild(textarea);
    textarea.select();

    try {
      return typeof this.document.execCommand === 'function'
        ? this.document.execCommand('copy')
        : false;
    } catch {
      return false;
    } finally {
      textarea.remove();
    }
  }
}
